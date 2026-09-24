import { setOwner } from '@ember/owner';

import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
}

const StoreKlass = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});
// this is an example of how to get a typescript InstanceType for StoreKlass
// that is properly extended/configured.
// most of the time, just use import { Store } from '@warp-drive/core';
// and you will be fine.
type Store = InstanceType<typeof StoreKlass>;
const Store = StoreKlass;

module('Legacy | Create | basic fields', function (hooks) {
  setupTest(hooks);

  test('attributes work when passed to createRecord', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord('user', { name: 'Rey Skybarker' }) as User;

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
  });

  test('id works when passed to createRecord', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord('user', { id: '1' }) as User;

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, undefined, 'name is accessible');
  });

  test('attributes work when updated after createRecord', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord('user', {}) as User;
    assert.equal(record.name, undefined, 'name is accessible');
    record.name = 'Rey Skybarker';
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
  });

  test('id works when updated after createRecord', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord('user', {}) as User;
    assert.equal(record.id, null, 'id is accessible');
    record.id = '1';
    assert.equal(record.id, '1', 'id is accessible');
  });
});
