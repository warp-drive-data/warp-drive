import { setOwner } from '@ember/owner';

import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('SCRATCH | abstract type later becomes concrete', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('adapter:application', JSONAPIAdapter);
  });

  test('registering a real schema for an abstract type AFTER it was synthesized, before any resolution', function (assert) {
    const store = new Store();
    setOwner(store, this.owner as never);
    (this.owner as { register: (n: string, s: unknown, o?: object) => void }).register('service:store', store, {
      instantiate: false,
    });
    const { schema } = store;

    // Step 1: register project, which synthesizes `abstract-record` via `as`.
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

    console.log('BEFORE overwrite, synthesized abstract-record fields:', [...schema.fields({ type: 'abstract-record' }).keys()]);

    // Step 2: later, register a REAL concrete schema for `abstract-record`
    // (e.g. it turns out to also be a real resource with its own data),
    // WITHOUT redeclaring the `events` relationship that `project` implements via `as`.
    schema.registerResource(
      withLegacy({
        type: 'abstract-record',
        fields: [{ name: 'name', kind: 'attribute' }],
      })
    );

    console.log('AFTER overwrite, abstract-record fields:', [...schema.fields({ type: 'abstract-record' }).keys()]);

    // Step 3: now resolve the relationship for the first time.
    const project = store.push({ data: { type: 'project', id: '1' } }) as { events: { length: number } };
    let threw: unknown = null;
    try {
      store.push({
        data: {
          type: 'event',
          id: '3',
          relationships: {
            record: { data: { type: 'project', id: '1' } },
          },
        },
      });
    } catch (e) {
      threw = e;
    }

    console.log('threw:', threw);
    console.log('project.events.length:', project.events.length);
    assert.ok(true, 'observed behavior logged above');
  });
});
