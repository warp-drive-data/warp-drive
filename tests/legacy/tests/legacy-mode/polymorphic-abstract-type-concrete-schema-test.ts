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

// Declares `events` as a `belongsTo`, conflicting with the `hasMany` shape
// that `project` (via `as: 'abstract-record'`) expects `abstract-record` to have.
function registerConflictingConcreteAbstractRecord(schema: SchemaService) {
  schema.registerResource(
    withLegacy({
      type: 'abstract-record',
      fields: [
        {
          name: 'events',
          kind: 'belongsTo',
          type: 'event',
          options: { async: false, inverse: null },
        },
      ],
    })
  );
}

// Declares `events` matching `project`'s contributed shape in every regard
// (`kind`, `type`, `inverse`, `async`) except that it omits the redundant
// self-referential `as: 'abstract-record'` that every contributor - the
// abstract type's own schema included - is expected to declare.
function registerConcreteAbstractRecordMissingAs(schema: SchemaService) {
  schema.registerResource(
    withLegacy({
      type: 'abstract-record',
      fields: [
        {
          name: 'events',
          kind: 'hasMany',
          type: 'event',
          options: { async: false, inverse: 'record' },
        },
      ],
    })
  );
}

// A second implementer of `abstract-record`, whose `events` field conflicts
// in `kind` with the one `project` contributes.
function registerConflictingTask(schema: SchemaService) {
  schema.registerResource(
    withLegacy({
      type: 'task',
      fields: [
        {
          name: 'events',
          kind: 'belongsTo',
          type: 'event',
          options: { async: false, inverse: null, as: 'abstract-record' },
        },
      ],
    })
  );
}

module('Legacy | Reads | polymorphic relationship whose abstract type also has a concrete schema', function (hooks) {
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

      assert.ok(
        fieldNames.includes('name'),
        `'name' (declared on the concrete schema) is present: ${fieldNames.join(', ')}`
      );
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

      assert.ok(
        fieldNames.includes('name'),
        `'name' (declared on the concrete schema) is present: ${fieldNames.join(', ')}`
      );
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

  module('when a later declaration disagrees on the relationship kind', function () {
    test('abstract discovered first as hasMany, then a concrete schema declares it belongsTo', function (assert) {
      const store = createStore(this);
      const { schema } = store;

      // `project` implements `abstract-record` assuming `events` is a
      // `hasMany`, synthesizing that shape onto `abstract-record`.
      registerProject(schema);

      // `abstract-record` turns out to be a real resource, but its author
      // (unaware of `project`'s assumption) declared `events` as a
      // `belongsTo` instead. This is a genuine contradiction, not an
      // override - resolving it silently in either direction would leave
      // one side of the relationship broken.
      assert.throws(
        () => registerConflictingConcreteAbstractRecord(schema),
        /to be declared identically/,
        'registering a conflicting concrete schema throws rather than silently discarding the synthesized shape'
      );
    });

    test('concrete schema declares belongsTo first, then an implementer assumes hasMany', function (assert) {
      const store = createStore(this);
      const { schema } = store;

      registerConflictingConcreteAbstractRecord(schema);

      assert.throws(
        () => registerProject(schema),
        /to be declared identically/,
        'registering an implementer whose assumed shape conflicts with the existing concrete schema throws'
      );
    });

    test('two implementers disagree on the relationship kind, with no concrete schema involved', function (assert) {
      const store = createStore(this);
      const { schema } = store;

      registerProject(schema);

      assert.throws(
        () => registerConflictingTask(schema),
        /to be declared identically/,
        'a second implementer with a conflicting shape throws rather than being silently ignored'
      );
    });
  });

  module('when a later declaration disagrees on `as`', function () {
    test("the abstract type's own schema omitting the redundant `as` throws, even though every other option matches", function (assert) {
      const store = createStore(this);
      const { schema } = store;

      // `project` implements `abstract-record` via `events`, synthesizing
      // that shape - including `options.as: 'abstract-record'` - onto
      // `abstract-record`.
      registerProject(schema);

      // `abstract-record` turns out to be a real resource whose own
      // `events` field matches `project`'s contribution in `kind`, `type`,
      // `inverse`, and `async` - but its author didn't think to (redundantly)
      // declare `as: 'abstract-record'` on it. Relationship resolution
      // elsewhere matches purely by name/inverse and would never notice this
      // on its own - so this must be caught here, at registration time,
      // rather than only if and when a record actually exercises the field.
      assert.throws(
        () => registerConcreteAbstractRecordMissingAs(schema),
        /to be declared identically/,
        'a concrete schema missing the redundant `as` throws rather than being silently accepted'
      );
    });
  });

  module('the abstract type satisfying its own polymorphic relationship', function () {
    function setupStore(context: { owner: unknown }) {
      const store = createStore(context);
      const { schema } = store;

      // `abstract-record` is both a real, directly-resolvable resource
      // (with its own `name` attribute) *and* the abstract type that
      // `project` implements via `as`. Because the field synthesized onto
      // `abstract-record`'s own schema keeps `options.as: 'abstract-record'`
      // (redundant/self-referential), `abstract-record` itself - not just
      // `project` - is a valid concrete value for `event.record`.
      registerConcreteAbstractRecord(schema);
      registerProject(schema);
      registerEvent(schema);

      return store;
    }

    test('pushing the abstract type itself into the polymorphic relationship works', function (assert) {
      const store = setupStore(this);

      const event = store.push<EventResource>({
        data: {
          type: 'event',
          id: '3',
          relationships: {
            record: { data: { type: 'abstract-record', id: '9' } },
          },
        },
        included: [{ type: 'abstract-record', id: '9', attributes: { name: 'Direct Record' } }],
      });

      assert.equal(event.record?.id, '9', 'event.record resolves to the abstract-record directly');
      assert.equal(event.record?.name, 'Direct Record', 'the concrete attribute on the abstract-record is readable');
    });
  });
});
