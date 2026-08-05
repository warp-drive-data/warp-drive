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

// `project` is the sole implementer of abstract `abstract-record`.
type ProjectResource = {
  id: string | null;
  $type: 'project';
  events: Array<MeetingResource | CallResource>;
  [Type]: 'project';
};

// `meeting` and `call` both implement abstract `abstract-event`.
type MeetingResource = {
  id: string | null;
  $type: 'meeting';
  record: ProjectResource | null;
  [Type]: 'meeting';
};

type CallResource = {
  id: string | null;
  $type: 'call';
  record: ProjectResource | null;
  [Type]: 'call';
};

module(
  'Legacy | Reads | polymorphic-to-polymorphic relationship where both sides reference abstract types',
  function (hooks) {
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

      // Note: neither `abstract-record` nor `abstract-event` is ever given
      // its own schema, Model, or Mixin - both are pure abstract unions,
      // each with only concrete implementers. `project.events`'s own `type`
      // is the *abstract* `abstract-event` (not a concrete type), and
      // `meeting`/`call`'s `record` field's `type` is the abstract
      // `abstract-record`. Both ends of this one relationship pair are
      // abstract.
      schema.registerResource(
        withLegacy({
          type: 'project',
          fields: [
            {
              name: 'events',
              kind: 'hasMany',
              type: 'abstract-event',
              options: { async: false, inverse: 'record', polymorphic: true, as: 'abstract-record' },
            },
          ],
        })
      );
      schema.registerResource(
        withLegacy({
          type: 'meeting',
          fields: [
            {
              name: 'record',
              kind: 'belongsTo',
              type: 'abstract-record',
              options: { async: false, inverse: 'events', polymorphic: true, as: 'abstract-event' },
            },
          ],
        })
      );
      schema.registerResource(
        withLegacy({
          type: 'call',
          fields: [
            {
              name: 'record',
              kind: 'belongsTo',
              type: 'abstract-record',
              options: { async: false, inverse: 'events', polymorphic: true, as: 'abstract-event' },
            },
          ],
        })
      );

      return store;
    }

    test('both abstract types are synthesized with the expected shape', function (assert) {
      const store = setupStore(this);
      const { schema } = store;

      assert.ok(schema.hasResource({ type: 'abstract-record' }), 'abstract-record was synthesized');
      assert.ok(schema.hasResource({ type: 'abstract-event' }), 'abstract-event was synthesized');

      const recordFields = schema.fields({ type: 'abstract-record' });
      const eventField = recordFields.get('events') as {
        kind?: string;
        type?: string;
        options?: { polymorphic?: boolean };
      };
      assert.equal(eventField?.kind, 'hasMany', 'abstract-record.events is a hasMany');
      assert.equal(eventField?.type, 'abstract-event', 'abstract-record.events points at the abstract-event union');
      assert.true(
        !!eventField?.options?.polymorphic,
        'abstract-record.events is itself polymorphic, since it points at an abstract union'
      );

      const eventFields = schema.fields({ type: 'abstract-event' });
      const recordField = eventFields.get('record') as {
        kind?: string;
        type?: string;
        options?: { polymorphic?: boolean };
      };
      assert.equal(recordField?.kind, 'belongsTo', 'abstract-event.record is a belongsTo');
      assert.equal(recordField?.type, 'abstract-record', 'abstract-event.record points at the abstract-record union');
      assert.true(!!recordField?.options?.polymorphic, 'abstract-event.record is polymorphic');
    });

    test('resolving the concrete hasMany side first works, for either concrete implementer of the "many" side', function (assert) {
      const store = setupStore(this);

      const project = store.push<ProjectResource>({
        data: { type: 'project', id: '1' },
      });

      assert.equal(project.events.length, 0, 'events starts empty');

      const meeting = store.push<MeetingResource>({
        data: {
          type: 'meeting',
          id: '3',
          relationships: {
            record: { data: { type: 'project', id: '1' } },
          },
        },
      });

      assert.equal(meeting.record?.id, '1', 'meeting.record resolves to the project');
      assert.equal(project.events.length, 1, 'project.events contains the meeting');
      assert.equal(project.events[0]?.id, '3', 'project.events contains the right meeting');

      const call = store.push<CallResource>({
        data: {
          type: 'call',
          id: '4',
          relationships: {
            record: { data: { type: 'project', id: '1' } },
          },
        },
      });

      assert.equal(call.record?.id, '1', 'call.record resolves to the project');
      assert.equal(project.events.length, 2, 'project.events contains both the meeting and the call');
      assert.ok(
        project.events.some((e) => e.id === '3' && recordIdentifierFor(e).type === 'meeting'),
        'project.events contains the meeting'
      );
      assert.ok(
        project.events.some((e) => e.id === '4' && recordIdentifierFor(e).type === 'call'),
        'project.events contains the call'
      );
    });

    test('resolving the polymorphic belongsTo side first works, for either concrete implementer of the "many" side', function (assert) {
      const store = setupStore(this);

      const meeting = store.push<MeetingResource>({
        data: {
          type: 'meeting',
          id: '3',
          relationships: {
            record: { data: { type: 'project', id: '1' } },
          },
        },
        included: [{ type: 'project', id: '1' }],
      });

      assert.equal(meeting.record?.id, '1', 'meeting.record resolves to the project');

      const projectIdentifier = recordIdentifierFor(meeting.record);
      const project = store.peekRecord<ProjectResource>(projectIdentifier);
      assert.ok(project, 'pre-cond, project is in the cache');
      assert.equal(project!.events.length, 1, 'project.events contains the meeting');
      assert.equal(project!.events[0]?.id, '3', 'project.events contains the right meeting');

      const call = store.push<CallResource>({
        data: {
          type: 'call',
          id: '4',
          relationships: {
            record: { data: { type: 'project', id: '1' } },
          },
        },
      });

      assert.equal(call.record?.id, '1', 'call.record resolves to the project');
      assert.equal(project!.events.length, 2, 'project.events contains both the meeting and the call');
    });
  }
);
