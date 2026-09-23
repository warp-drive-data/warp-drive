import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
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

function setupStore(context: TestContext): Store {
  const TestStore = useRecommendedStore({
    handlers: [new MockServerHandler(context)],
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
  return new TestStore();
}

module('Integration | <JSONAPICache> a local edit to `undefined`', function () {
  test('a mid-flight set to `undefined` whose save is contradicted by the server', async function (assert) {
    const store = setupStore(this);
    const url = buildBaseURL({ resourcePath: 'api/user/1' });

    store.push({
      data: { type: 'user', id: '1', attributes: { firstName: 'Chris', lastName: 'Thoburn' } },
    });
    const user = store.peekRecord<ExistingUser>('user', '1')!;
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notified(lid, 'attributes', 'firstName', 1, 'the edit notified once');

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

    const pending = store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );

    // lands after willCommit moved localAttrs into inflightAttrs, before didCommit
    (editable as unknown as Record<string, unknown>).firstName = undefined;

    await pending;

    const localValue = (editable as unknown as Record<string, unknown>).firstName;
    assert.equal(localValue, undefined, `the local projection reads undefined (got ${String(localValue)})`);
    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 1, 'remote heard the save');
    // the mid-flight edit itself legitimately emits one local notification. A second one, from
    // the save, would be the divergence: the local projection read undefined before and after
    // didCommit.
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, "only the edit's own local notification fired");
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the save did not announce the key unscoped');
  });
});
