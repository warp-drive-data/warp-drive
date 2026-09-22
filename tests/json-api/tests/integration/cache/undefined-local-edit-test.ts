import type { NotificationType, Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import type { TestContext } from '@warp-drive/diagnostic/-types';
import { MockServerHandler } from '@warp-drive/holodeck';
import { PATCH } from '@warp-drive/holodeck/mock';
import { JSONAPICache } from '@warp-drive/json-api';
import { buildBaseURL } from '@warp-drive/utilities';

/**
 * `getAttr` resolves the local projection with `attribute in cached.localAttrs`, so a field
 * explicitly set to `undefined` shadows the persisted value like any other uncommitted edit.
 * `calculateChangedKeys` has to answer that same question to decide which channel a key moved
 * on, and deciding it with `localEdit !== undefined` instead read such a key as unedited.
 *
 * The local projection then looked like it was following the remote one, so a save that changed
 * the persisted value announced a local move the reader could never observe -- it read
 * `undefined` before and after.
 */

interface ExistingUser {
  [Type]: 'user';
  id: string;
  firstName: string;
  lastName: string;
}

interface CustomContext extends TestContext {
  store: Store;
}

function flush(store: Store): void {
  (store.notifications as unknown as { _flush: () => void })._flush();
}

function watch(store: Store, record: unknown, channel: 'local' | 'remote'): string[] {
  const keys: string[] = [];
  store.notifications.subscribe(
    recordIdentifierFor(record as object),
    (_cacheKey: ResourceKey, type: NotificationType, key?: string | null) => {
      if (type === 'attributes') keys.push(String(key));
    },
    channel
  );
  return keys;
}

module<CustomContext>('Integration | <JSONAPICache> a local edit to `undefined`', function (hooks) {
  hooks.beforeEach(function () {
    const TestStore = useRecommendedStore({
      handlers: [new MockServerHandler(this)],
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
    this.store = new TestStore();
  });

  test<CustomContext>('a mid-flight set to `undefined` whose save is contradicted by the server', async function (assert) {
    const { store } = this;
    const url = buildBaseURL({ resourcePath: 'api/user/1' });

    store.push({
      data: { type: 'user', id: '1', attributes: { firstName: 'Chris', lastName: 'Thoburn' } },
    });
    const user = store.peekRecord<ExistingUser>('user', '1')!;
    const lid = recordIdentifierFor(user);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);

    const body = JSON.stringify({
      data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } },
    });
    // the server normalizes to a different value than we sent
    await PATCH(
      this,
      '/api/user/1',
      () => ({ data: { type: 'user', id: '1', attributes: { firstName: 'CHRISTOPHER' } } }),
      { body }
    );

    const localDuringSave = watch(store, user, 'local');
    const remoteDuringSave = watch(store, user, 'remote');

    const pending = store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );

    // lands after willCommit moved localAttrs into inflightAttrs, before didCommit
    (editable as unknown as Record<string, unknown>).firstName = undefined;

    await pending;
    flush(store);

    const localValue = (editable as unknown as Record<string, unknown>).firstName;

    assert.equal(localValue, undefined, `the local projection reads undefined (got ${String(localValue)})`);
    assert.true(remoteDuringSave.includes('firstName'), `remote heard it (saw ${remoteDuringSave.join()})`);

    // the edit itself legitimately emits one local notification. A second one, from the save,
    // would be the divergence: the local projection read undefined before and after didCommit.
    const localFromSave = localDuringSave.filter((k) => k === 'firstName').length;
    assert.equal(
      localFromSave,
      1,
      `expected only the edit's own local notification, saw ${localFromSave} (${localDuringSave.join()})`
    );
  });
});
