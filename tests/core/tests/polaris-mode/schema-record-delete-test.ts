import { recordIdentifierFor } from '@warp-drive/core';
import { checkout } from '@warp-drive/core/reactive';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';

import type { EditableUser, User } from '../-utils/store';
import { createStore } from '../-utils/store';

module('SchemaRecord | Polaris | Delete Operations', function (hooks) {
  setupTest(hooks);

  test('deleteRecord marks a record as deleted', function (assert) {
    const store = createStore(this.owner);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skywalker' },
      },
    });

    assert.ok(store.peekRecord('user', '1'), 'record exists initially');

    store.deleteRecord(record);

    const fetchedRecord = store.peekRecord('user', '1') as User;
    assert.ok(fetchedRecord, 'record still exists in store');
    assert.true(store.cache.isDeleted(recordIdentifierFor(fetchedRecord)), 'record is marked as deleted');
  });

  test('deleteRecord on an editable record marks both versions as deleted', async function (assert) {
    const store = createStore(this.owner);

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skywalker' },
      },
    });

    const editableRecord = await checkout<EditableUser>(immutableRecord);

    assert.ok(store.peekRecord('user', '1'), 'record exists initially');

    store.deleteRecord(editableRecord);
    await this.h.settled();

    const fetchedRecord = store.peekRecord<User>('user', '1');
    assert.ok(fetchedRecord, 'record still exists in store');
    assert.true(store.cache.isDeleted(recordIdentifierFor(fetchedRecord)), 'immutable record is marked as deleted');
  });

  test('destroyRecord removes a record from the store', function (assert) {
    const store = createStore(this.owner);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
      },
    });

    assert.ok(store.peekRecord('user', '1'), 'record exists initially');

    // destroyRecord implementation
    store.deleteRecord(record);
    store.unloadRecord(record);

    const fetchedRecord = store.peekRecord('user', '1');
    assert.equal(fetchedRecord, null, 'record is removed from the store after destroyRecord');
  });

  test('destroyRecord on an editable record cleans up both versions', async function (assert) {
    const store = createStore(this.owner);

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skywalker' },
      },
    });

    const editableRecord = await checkout<EditableUser>(immutableRecord);

    assert.ok(store.peekRecord('user', '1'), 'record exists initially');

    // destroyRecord implementation
    store.deleteRecord(editableRecord);
    store.unloadRecord(editableRecord);

    const fetchedImmutableRecord = store.peekRecord('user', '1');
    assert.equal(
      fetchedImmutableRecord,
      null,
      'immutable record is removed from the store after editable destroyRecord'
    );
  });

  test('unloadRecord removes a record from the store', function (assert) {
    const store = createStore(this.owner);

    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skywalker' },
      },
    });

    const user = store.peekRecord('user', '1');

    assert.ok(user, 'record exists initially');

    store.unloadRecord(user);

    const fetchedRecord = store.peekRecord('user', '1');
    assert.equal(fetchedRecord, null, 'record is removed from the store after unloadRecord');
  });

  test('unloadRecord on an editable record cleans up both versions', async function (assert) {
    const store = createStore(this.owner);

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skywalker' },
      },
    });

    const editableRecord = await checkout<EditableUser>(immutableRecord);

    assert.ok(store.peekRecord('user', '1'), 'record exists initially');

    assert.ok(editableRecord, 'editable record exists');

    store.unloadRecord(editableRecord);

    const fetchedImmutableRecord = store.peekRecord('user', '1');
    assert.equal(
      fetchedImmutableRecord,
      null,
      'immutable record is removed from the store after editable unloadRecord'
    );
  });
});
