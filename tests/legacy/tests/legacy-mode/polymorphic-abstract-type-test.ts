import { setOwner } from '@ember/owner';

import { recordIdentifierFor } from '@warp-drive/core';
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
  record: ProjectResource | null;
  [Type]: 'event';
};

module('Legacy | Reads | polymorphic relationship with an unregistered abstract type', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('adapter:application', JSONAPIAdapter);
  });

  function setupStore(context: { owner: unknown }) {
    const store = new Store();
    setOwner(store, context.owner as never);
    (context.owner as { register: (n: string, s: unknown, o?: object) => void }).register('service:store', store, {
      instantiate: false,
    });
    const { schema } = store;

    // Note: we deliberately never register a schema, Model, or Mixin for
    // `abstract-record` - it is only ever a virtual/abstract polymorphic
    // type, implemented by `project` via `as: 'abstract-record'`.
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

    return store;
  }

  test('resolving the concrete hasMany side first works', function (assert) {
    const store = setupStore(this);

    const project = store.push<ProjectResource>({
      data: { type: 'project', id: '1' },
    });

    assert.equal(project.events.length, 0, 'events starts empty');

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

    // Load the Event (with its polymorphic belongsTo pointing at an
    // unregistered abstract type) before ever touching the Project's
    // hasMany side. This is the order in which a `store.request` for
    // events would typically populate the cache.
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
});
