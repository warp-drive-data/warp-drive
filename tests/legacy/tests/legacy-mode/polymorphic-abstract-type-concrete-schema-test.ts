import { setOwner } from '@ember/owner';

import { recordIdentifierFor } from '@warp-drive/core';
import type { SchemaService } from '@warp-drive/core/types';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

type ProjectResource = {
  id: string | null;
  $type: 'project';
  events: EventResource[];
  [Type]: 'project';
};

type EventResource = {
  id: string | null;
  $type: 'event';
  record: AbstractRecordResource | null;
  [Type]: 'event';
};

type AbstractRecordResource = {
  id: string | null;
  $type: 'abstract-record';
  name: string | null;
  [Type]: 'abstract-record';
};

function registerProject(schema: SchemaService) {
  schema.registerResource(
    withLegacy({
      type: 'project',
      fields: [
        {
          name: 'events',
          kind: 'hasMany',
          type: 'event',
          options: { async: false, inverse: 'record', as: 'abstract-record' },
        },
      ],
    })
  );
}

function registerEvent(schema: SchemaService) {
  schema.registerResource(
    withLegacy({
      type: 'event',
      fields: [
        {
          name: 'record',
          kind: 'belongsTo',
          type: 'abstract-record',
          options: { async: false, inverse: 'events', polymorphic: true },
        },
      ],
    })
  );
}

function registerConcreteAbstractRecord(schema: SchemaService) {
  schema.registerResource(
    withLegacy({
      type: 'abstract-record',
      fields: [{ name: 'name', kind: 'attribute' }],
    })
  );
}

module(
  'Legacy | Reads | polymorphic relationship whose abstract type also has a concrete schema',
  function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
      this.owner.register('adapter:application', JSONAPIAdapter);
    });

    function createStore(context: { owner: unknown }) {
      const store = new Store();
      setOwner(store, context.owner as never);
      (context.owner as { register: (n: string, s: unknown, o?: object) => void }).register('service:store', store, {
        instantiate: false,
      });
      return store;
    }

    module('when the concrete schema is registered before its abstract implementers', function () {
      function setupStore(context: { owner: unknown }) {
        const store = createStore(context);
        const { schema } = store;

        // `abstract-record` turns out to also be a real, directly-resolvable
        // resource with its own data - registered before `project` ever
        // declares itself an implementer via `as: 'abstract-record'`.
        registerConcreteAbstractRecord(schema);
        registerProject(schema);
        registerEvent(schema);

        return store;
      }

      test('the synthesized relationship and the concrete schema fields coexist', function (assert) {
        const store = setupStore(this);
        const fieldNames = [...store.schema.fields({ type: 'abstract-record' }).keys()];

        assert.ok(fieldNames.includes('name'), `'name' (declared on the concrete schema) is present: ${fieldNames.join(', ')}`);
        assert.ok(
          fieldNames.includes('events'),
          `'events' (contributed by project's 'as: abstract-record') is present: ${fieldNames.join(', ')}`
        );
      });

      test('resolving the concrete hasMany side first works', function (assert) {
        const store = setupStore(this);

        const project = store.push<ProjectResource>({
          data: { type: 'project', id: '1' },
        });
        const event = store.push<EventResource>({
          data: {
            type: 'event',
            id: '3',
            relationships: {
              record: { data: { type: 'project', id: '1' } },
            },
          },
        });

        assert.equal(event.record?.id, '1', 'event.record resolves to the project');
        assert.equal(project.events.length, 1, 'project.events contains the event');
        assert.equal(project.events[0]?.id, '3', 'project.events contains the right event');
      });

      test('resolving the polymorphic belongsTo side first works', function (assert) {
        const store = setupStore(this);

        const event = store.push<EventResource>({
          data: {
            type: 'event',
            id: '3',
            relationships: {
              record: { data: { type: 'project', id: '1' } },
            },
          },
          included: [{ type: 'project', id: '1' }],
        });

        assert.equal(event.record?.id, '1', 'event.record resolves to the project');

        const projectIdentifier = recordIdentifierFor(event.record);
        const project = store.peekRecord<ProjectResource>(projectIdentifier);
        assert.ok(project, 'pre-cond, project is in the cache');
        assert.equal(project!.events.length, 1, 'project.events contains the event');
        assert.equal(project!.events[0]?.id, '3', 'project.events contains the right event');
      });

      test('abstract-record remains directly usable as its own concrete resource', function (assert) {
        const store = setupStore(this);

        const record = store.push<AbstractRecordResource>({
          data: { type: 'abstract-record', id: '9', attributes: { name: 'Direct Record' } },
        });

        assert.equal(record.name, 'Direct Record', 'the concrete attribute is readable');
      });
    });

    module('when the concrete schema is registered after its abstract implementers', function () {
      function setupStore(context: { owner: unknown }) {
        const store = createStore(context);
        const { schema } = store;

        // `project` declares itself an implementer of the (at this point
        // still-unregistered) abstract type `abstract-record` first, which
        // synthesizes a placeholder schema for it.
        registerProject(schema);
        registerEvent(schema);

        // Only afterwards does `abstract-record` turn out to also be a real,
        // directly-resolvable resource with its own data.
        registerConcreteAbstractRecord(schema);

        return store;
      }

      test('the synthesized relationship and the concrete schema fields coexist', function (assert) {
        const store = setupStore(this);
        const fieldNames = [...store.schema.fields({ type: 'abstract-record' }).keys()];

        assert.ok(fieldNames.includes('name'), `'name' (declared on the concrete schema) is present: ${fieldNames.join(', ')}`);
        assert.ok(
          fieldNames.includes('events'),
          `'events' (contributed by project's 'as: abstract-record') survives the later concrete registration: ${fieldNames.join(', ')}`
        );
      });

      test('resolving the concrete hasMany side first works', function (assert) {
        const store = setupStore(this);

        const project = store.push<ProjectResource>({
          data: { type: 'project', id: '1' },
        });
        const event = store.push<EventResource>({
          data: {
            type: 'event',
            id: '3',
            relationships: {
              record: { data: { type: 'project', id: '1' } },
            },
          },
        });

        assert.equal(event.record?.id, '1', 'event.record resolves to the project');
        assert.equal(project.events.length, 1, 'project.events contains the event');
        assert.equal(project.events[0]?.id, '3', 'project.events contains the right event');
      });

      test('resolving the polymorphic belongsTo side first works', function (assert) {
        const store = setupStore(this);

        const event = store.push<EventResource>({
          data: {
            type: 'event',
            id: '3',
            relationships: {
              record: { data: { type: 'project', id: '1' } },
            },
          },
          included: [{ type: 'project', id: '1' }],
        });

        assert.equal(event.record?.id, '1', 'event.record resolves to the project');

        const projectIdentifier = recordIdentifierFor(event.record);
        const project = store.peekRecord<ProjectResource>(projectIdentifier);
        assert.ok(project, 'pre-cond, project is in the cache');
        assert.equal(project!.events.length, 1, 'project.events contains the event');
        assert.equal(project!.events[0]?.id, '3', 'project.events contains the right event');
      });

      test('abstract-record remains directly usable as its own concrete resource', function (assert) {
        const store = setupStore(this);

        const record = store.push<AbstractRecordResource>({
          data: { type: 'abstract-record', id: '9', attributes: { name: 'Direct Record' } },
        });

        assert.equal(record.name, 'Direct Record', 'the concrete attribute is readable');
      });
    });
  }
);
