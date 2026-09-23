import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * `undefined` is not a JSON value. The cache used to store it as a local edit anyway, and the two
 * serializers then disagreed about what it meant: the legacy `JSONSerializer` dropped the key from
 * the payload, `serializePatch` sent `null`. `setAttr` now refuses it in development and stores
 * `null` in production, so every reader and serializer sees one value.
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

async function setupEditableUser() {
  const store: Store = new TestStore();
  store.push({
    data: { type: 'user', id: '1', attributes: { firstName: 'Chris', lastName: 'Thoburn' } },
  });
  const user = store.peekRecord<ExistingUser>('user', '1')!;
  const lid = recordIdentifierFor(user);
  const editable = await checkout<ExistingUser>(user);
  return { store, lid, editable };
}

module('Integration | <JSONAPICache> a local edit to `undefined`', function () {
  test('setting an attribute to undefined asserts and names the field', async function (assert) {
    const { editable } = await setupEditableUser();

    await assert.expectAssertion(
      // the field type does not allow it, which is the point; bypass it the way untyped app code would
      () => ((editable as unknown as Record<string, unknown>).firstName = undefined),
      /Cannot set 'firstName' on 'user' to undefined: undefined is not a JSON value\. Use null instead\./
    );
  });

  test('setting a nested value to undefined asserts with the full path', async function (assert) {
    const { store, lid } = await setupEditableUser();

    await assert.expectAssertion(
      () => store.cache.setAttr(lid, ['firstName', 'nope'], undefined as unknown as null),
      /Cannot set 'firstName\.nope' on 'user' to undefined/
    );
  });

  test('null is the value to use, and it reads back as null on the local projection only', async function (assert) {
    const { store, lid, editable } = await setupEditableUser();

    (editable as unknown as Record<string, unknown>).firstName = null;

    assert.equal(store.cache.getAttr(lid, 'firstName'), null, 'local state reads null');
    assert.equal(store.cache.getRemoteAttr(lid, 'firstName'), 'Chris', 'remote state is untouched');
    assert.deepEqual(store.cache.changedAttrs(lid).firstName, ['Chris', null], 'changedAttrs reports the null');
  });
});
