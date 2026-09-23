import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * `changedAttrs()` reports every unsaved mutation as `[the value it replaces, the new value]`.
 * These pin down what that means around a save that is still in flight when further edits
 * arrive, and after that save is rejected.
 */

interface ExistingUser {
  [Type]: 'user';
  id: string;
  firstName: string;
  lastName: string;
}

const TestStore = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    withDefaults({
      type: 'user',
      fields: [
        { name: 'firstName', kind: 'field' },
        { name: 'lastName', kind: 'field' },
      ],
    }),
  ],
});

/** Pushes a user, edits it, and starts (but does not finish) a save of that edit. */
async function editThenStartSave() {
  const store: Store = new TestStore();
  store.push({
    data: { type: 'user', id: '1', attributes: { firstName: 'Chris', lastName: 'Thoburn' } },
  });
  const user = store.peekRecord<ExistingUser>('user', '1')!;
  const lid = recordIdentifierFor(user);
  const editable = await checkout<ExistingUser>(user);
  editable.firstName = 'Christopher';
  store.cache.willCommit(lid, null);
  return { store, user, lid, editable };
}

module('Integration | <JSONAPICache>.changedAttrs around an in-flight save', function () {
  test('an edit made while a save is in flight is described against the in-flight value', async function (assert) {
    const { store, lid, editable } = await editThenStartSave();
    assert.deepEqual(
      store.cache.changedAttrs(lid).firstName,
      ['Chris', 'Christopher'],
      'the in-flight change is reported'
    );

    editable.firstName = 'Chris2';

    assert.deepEqual(
      store.cache.changedAttrs(lid).firstName,
      ['Christopher', 'Chris2'],
      'the pair describes what the next save would change, relative to the save in flight'
    );
  });

  test('reverting a mid-flight edit to the in-flight value keeps reporting the in-flight change', async function (assert) {
    const { store, lid, editable } = await editThenStartSave();

    editable.firstName = 'Chris2';
    editable.firstName = 'Christopher';

    assert.true(store.cache.hasChangedAttrs(lid), 'the record is still dirty while the save is in flight');
    assert.deepEqual(
      store.cache.changedAttrs(lid).firstName,
      ['Chris', 'Christopher'],
      'the field the save is still changing stays in changedAttrs'
    );
  });

  test('a rejected save re-anchors a diverging mid-flight edit to the remote value', async function (assert) {
    const { store, lid, editable } = await editThenStartSave();

    editable.firstName = 'Chris2';
    store.cache.commitWasRejected(lid, []);

    assert.equal(editable.firstName, 'Chris2', 'the newer local edit survives the rejection');
    assert.deepEqual(
      store.cache.changedAttrs(lid).firstName,
      ['Chris', 'Chris2'],
      'before is the persisted value, not the in-flight value the failed save carried'
    );

    store.cache.rollbackAttrs(lid);
    assert.equal(store.cache.getAttr(lid, 'firstName'), 'Chris', 'rollback restores what changedAttrs called before');
  });

  test('a rejected save drops a mid-flight edit that matches the remote value', async function (assert) {
    const { store, lid, editable } = await editThenStartSave();

    editable.firstName = 'Chris';
    store.cache.commitWasRejected(lid, []);

    assert.false(store.cache.hasChangedAttrs(lid), 'nothing differs from remote once the failed save is unwound');
    assert.equal(store.cache.changedAttrs(lid).firstName, undefined, 'changedAttrs has no entry for the field');
  });

  test('a rejected save does not overwrite a mid-flight edit to null', async function (assert) {
    const { store, lid, editable } = await editThenStartSave();

    (editable as unknown as Record<string, unknown>).firstName = null;
    store.cache.commitWasRejected(lid, []);

    assert.equal(
      store.cache.getAttr(lid, 'firstName'),
      null,
      'the rejection does not resurrect the failed in-flight value over the newer edit'
    );
    assert.deepEqual(store.cache.changedAttrs(lid).firstName, ['Chris', null], 'before is the persisted value');
  });
});
