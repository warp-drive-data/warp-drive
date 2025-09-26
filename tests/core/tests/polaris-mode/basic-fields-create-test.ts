import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import { withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
  [Type]: 'user';
}

module('Polaris | Create | basic fields', function (hooks) {
  setupTest(hooks);

  test('fields work when passed to createRecord', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', { name: 'Rey Skybarker' });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
  });

  test('id works when passed to createRecord', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', { id: '1' });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, undefined, 'name is accessible');
  });

  test('attributes work when updated after createRecord', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', {});
    assert.equal(record.name, undefined, 'name is accessible');
    record.name = 'Rey Skybarker';
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
  });

  test('id works when updated after createRecord', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', {});
    assert.equal(record.id, null, 'id is accessible');
    record.id = '1';
    assert.equal(record.id, '1', 'id is accessible');
  });

  test('we can create a new record with a pre-set lid', function (assert) {
    const store = new Store();

    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    const lid = '@test/lid:user-chris-asdf-1234';
    const record = store.createRecord('user', { name: 'Chris' }, { lid: '@test/lid:user-chris-asdf-1234' });
    const identifier = recordIdentifierFor(record);
    assert.equal(identifier.lid, lid, 'we used the custom lid');
  });

  test('createRecord does not return the primary record', function (assert) {
    const store = new Store();

    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    const record = store.createRecord('user', { name: 'Chris' });
    const identifier = recordIdentifierFor(record);
    const primaryRecord = store.peekRecord<User>(identifier);
    assert.ok(!!primaryRecord, 'we have a peekable primary record');
    assert.false(record === primaryRecord, 'the records should not be the same reference');
    const primaryIdentifier = recordIdentifierFor(primaryRecord);
    assert.true(identifier === primaryIdentifier, 'the records should have the same identifier reference');
  });

  test('the primary record is not editable', function (assert) {
    const store = new Store();

    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    const record = store.createRecord<User>('user', { name: 'Chris' });
    const identifier = recordIdentifierFor(record);
    const primaryRecord = store.peekRecord<User>(identifier);

    try {
      primaryRecord!.name = 'James';
      assert.ok(false, 'we should error');
    } catch (e) {
      assert.equal(
        (e as Error).message,
        DEBUG
          ? 'Cannot set name on user because the ReactiveResource is not editable'
          : "'set' on proxy: trap returned falsish for property 'name'",
        'we cannot mutate the primary record'
      );
    }

    assert.equal(primaryRecord?.name, undefined, 'the primary record does not show the creation value');
  });

  test('the primary record is not included peekAll', function (assert) {
    const store = new Store();

    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    store.createRecord<User>('user', { name: 'Chris' });

    // eslint-disable-next-line warp-drive/no-legacy-request-patterns
    const all = store.peekAll<User>('user');
    assert.equal(all.length, 0, 'Our empty new record does not appear in the list of all records');
  });

  test('we can unload via the primary record', function (assert) {
    const store = new Store();

    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    const record = store.createRecord<User & { ___notifications: null | object }>('user', { name: 'Chris' });
    const identifier = recordIdentifierFor(record);
    const primaryRecord = store.peekRecord<User>(identifier);

    store.unloadRecord(primaryRecord);

    // peekRecord should now be `null`
    const peeked = store.peekRecord<User>(identifier);
    assert.equal(peeked, null, 'we can no longer peek the record');
    const cacheEntry = store.cache.peek(identifier);
    assert.equal(cacheEntry, null, 'there is no cache entry');

    // this check should become `$state.isDestroyed` once that is a thing
    assert.equal(record.___notifications, null, 'the record was destroyed');
  });

  test('we can unload via the editable record', function (assert) {
    const store = new Store();

    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    const record = store.createRecord<User & { ___notifications: null | object }>('user', { name: 'Chris' });
    const identifier = recordIdentifierFor(record);

    store.unloadRecord(record);

    const primaryRecord = store.peekRecord<User>(identifier);
    assert.equal(primaryRecord, null, 'the primary record no longer exists');
    const cacheEntry = store.cache.peek(identifier);
    assert.equal(cacheEntry, null, 'there is no cache entry');

    // this check should become `$state.isDestroyed` once that is a thing
    assert.equal(record.___notifications, null, 'the record was destroyed');
  });
});
