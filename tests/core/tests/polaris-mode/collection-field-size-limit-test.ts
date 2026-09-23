import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import { withDefaults } from '@warp-drive/core/reactive';
import type { SingleResourceDocument } from '@warp-drive/core/types/spec/json-api-raw';
import type { Type } from '@warp-drive/core/types/symbols';
import { setupOnError } from '@warp-drive/diagnostic';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  friends: ReactiveRelationshipDocument<User[]>;
  legacyFriends: User[];
  [Type]: 'user';
}

const UserSchema = withDefaults({
  type: 'user',
  fields: [
    {
      name: 'name',
      kind: 'field',
    },
    {
      name: 'friends',
      type: 'user',
      kind: 'collection',
      options: { inverse: null, async: false },
    },
    {
      name: 'legacyFriends',
      type: 'user',
      kind: 'hasMany',
      options: { inverse: null, async: false, linksMode: true },
    },
  ],
});

function friendsPayload(field: 'friends' | 'legacyFriends', count: number): SingleResourceDocument<'user'> {
  const data: Array<{ type: 'user'; id: string }> = [];
  const included: SingleResourceDocument<'user'>['included'] = [];
  for (let i = 0; i < count; i++) {
    const id = `${i + 2}`;
    data.push({ type: 'user', id });
    // collection relationships require every referenced resource to be included
    included.push({ type: 'user', id, attributes: { name: `Friend ${id}` } });
  }
  return {
    data: {
      type: 'user',
      id: '1',
      attributes: { name: 'Leo' },
      relationships: {
        [field]: { links: { related: `/user/1/${field}` }, data },
      },
    },
    included,
  };
}

/**
 * Captures the next uncaught error and resolves with it, or resolves
 * with `null` if none is thrown before the microtask queue drains.
 */
function captureUncaughtError(): Promise<Error | string | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const cleanup = setupOnError((error) => {
      resolved = true;
      resolve(error);
    });
    // asyncThrow uses a microtask; wait one macrotask for it to fire
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        resolve(null);
      }
    }, 0);
  });
}

module('Collection | maxCollectionRelationshipSize', function (hooks) {
  setupTest(hooks);

  test('a collection payload larger than the configured limit throws asynchronously after being applied', async function (assert) {
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [UserSchema],
      maxCollectionRelationshipSize: 2,
    });
    const store = new Store();
    assert.equal(store.maxCollectionRelationshipSize, 2, 'the limit is configured on the store');

    const pending = captureUncaughtError();
    const record = store.push<User>(friendsPayload('friends', 3));

    assert.equal(record.friends.data?.length, 3, 'the payload was still applied to the cache');

    const error = await pending;
    assert.true(error instanceof Error, 'an error was thrown asynchronously');
    assert.equal(
      (error as Error).message,
      'The collection relationship user.friends received 3 related resources, exceeding the configured maxCollectionRelationshipSize of 2. Large collections should be loaded with a top-level (paginated) request instead of through the relationship. See https://docs.warp-drive.io/guides/the-manual/relational-data/advanced/large-collections',
      'the error explains the problem and the fix'
    );
  });

  test('a collection payload at or below the limit does not throw', async function (assert) {
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [UserSchema],
      maxCollectionRelationshipSize: 2,
    });
    const store = new Store();

    const pending = captureUncaughtError();
    const record = store.push<User>(friendsPayload('friends', 2));

    assert.equal(record.friends.data?.length, 2, 'the payload was applied to the cache');
    assert.equal(await pending, null, 'no error was thrown');
  });

  test('the limit does not apply to legacy hasMany fields', async function (assert) {
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [UserSchema],
      maxCollectionRelationshipSize: 2,
    });
    const store = new Store();

    const pending = captureUncaughtError();
    const record = store.push<User>(friendsPayload('legacyFriends', 3));

    assert.equal(record.legacyFriends.length, 3, 'the payload was applied to the cache');
    assert.equal(await pending, null, 'no error was thrown');
  });

  test('the limit is off by default', async function (assert) {
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [UserSchema],
    });
    const store = new Store();
    assert.equal(store.maxCollectionRelationshipSize, null, 'the limit is not configured');

    const pending = captureUncaughtError();
    const record = store.push<User>(friendsPayload('friends', 50));

    assert.equal(record.friends.data?.length, 50, 'the payload was applied to the cache');
    assert.equal(await pending, null, 'no error was thrown');
  });
});
