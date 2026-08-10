import type { CacheOperation, DocumentCacheOperation, NotificationType, NotifyKeys } from '@warp-drive/core';
import { Store } from '@warp-drive/core';
import { instantiateRecord, registerDerivations, teardownRecord, withDefaults } from '@warp-drive/core/reactive';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import type { RequestKey, ResourceKey } from '@warp-drive/core/types/identifier';
import type { StructuredDataDocument } from '@warp-drive/core/types/request';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

import { TestSchema } from '../../utils/schema';

interface User {
  id: string;
  name: string;
  bestFriend: User | null;
  friends: User[];
}

class TestStore extends Store {
  createSchemaService() {
    const schema = new TestSchema();
    schema.registerResource({
      type: 'user',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { name: 'name', kind: 'field' },
        { name: 'username', kind: 'field' },
        { name: 'age', kind: 'field' },
      ],
    });
    return schema;
  }

  override createCache(wrapper: CacheCapabilitiesManager) {
    return new Cache(wrapper);
  }
}

class RelationshipTestStore extends Store {
  createSchemaService() {
    const schema = new TestSchema();
    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          {
            name: 'bestFriend',
            kind: 'belongsTo',
            type: 'user',
            options: { inverse: 'bestFriend', async: false, linksMode: true },
          },
          {
            name: 'friends',
            kind: 'hasMany',
            type: 'user',
            options: { inverse: 'friends', async: false, linksMode: true },
          },
        ],
      })
    );
    registerDerivations(schema);
    return schema;
  }

  override createCache(wrapper: CacheCapabilitiesManager) {
    return new Cache(wrapper);
  }

  override instantiateRecord(identifier: ResourceKey, createArgs: Record<string, unknown>) {
    return instantiateRecord(this, identifier, createArgs);
  }

  override teardownRecord(record: User): void {
    return teardownRecord(record);
  }
}

function asStructuredDocument<T>(doc: {
  request?: { url: string; cacheOptions?: { key?: string } };
  content: T;
}): StructuredDataDocument<T> {
  return doc as unknown as StructuredDataDocument<T>;
}

type Call = [type: NotificationType, key: string | undefined];

module('Integration | NotificationManager batch notifications', function () {
  test('notify(identifier, "attributes", keys: Set<string>) delivers the same sequence of notifications as calling notify once per key', function (assert) {
    const store = new TestStore();

    const identifierBatch = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const identifierIndividual = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });

    const batchCalls: Call[] = [];
    const individualCalls: Call[] = [];

    const tokenBatch = store.notifications.subscribe(
      identifierBatch,
      (_key: ResourceKey, type: NotificationType, key?: string) => {
        batchCalls.push([type, key]);
      }
    );
    const tokenIndividual = store.notifications.subscribe(
      identifierIndividual,
      (_key: ResourceKey, type: NotificationType, key?: string) => {
        individualCalls.push([type, key]);
      }
    );

    // the new batch calling convention: a single notify() call carrying a Set of keys
    store.notifications.notify(identifierBatch, 'attributes', new Set(['name', 'username', 'age']));

    // the pre-existing calling convention: one notify() call per key
    store.notifications.notify(identifierIndividual, 'attributes', 'name');
    store.notifications.notify(identifierIndividual, 'attributes', 'username');
    store.notifications.notify(identifierIndividual, 'attributes', 'age');

    assert.deepEqual(
      batchCalls,
      [
        ['attributes', 'name'],
        ['attributes', 'username'],
        ['attributes', 'age'],
      ],
      'the batch call delivered one notification per key, in Set-insertion order'
    );
    assert.deepEqual(
      batchCalls,
      individualCalls,
      'the batch call produced the exact same subscriber notifications as the equivalent individual calls'
    );

    store.notifications.unsubscribe(tokenBatch);
    store.notifications.unsubscribe(tokenIndividual);
  });

  test('cache upsert with multiple changed attributes notifies once per changed attribute', function (assert) {
    const store = new TestStore();

    const responseDocument = store.cache.put(
      asStructuredDocument({
        content: {
          data: { type: 'user', id: '1', attributes: { name: 'Chris', username: 'runspired', age: 30 } },
        },
      })
    );
    const identifier = responseDocument.data as ResourceKey;

    const seenKeys: string[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string) => {
        if (type === 'attributes' && key) {
          seenKeys.push(key);
        }
      }
    );

    // spy on the underlying `notify` to confirm the batch of changed keys
    // computed internally by the cache (a `Set<string>` from
    // `calculateChangedKeys`) is handed to `notify` as-is, never converted
    // to an array first.
    let batchKeyWasSet = false;
    const originalNotify = store.notifications.notify.bind(store.notifications);
    // `Parameters<typeof originalNotify>` would resolve to the *last* overload
    // of the overloaded `notify` signature (a well-known TS quirk), narrowing
    // `type`/`key` to types too specific to compare against `'attributes'`/`Set`.
    // Type the spy broadly instead and cast only at the delegating call below.
    store.notifications.notify = ((
      cacheKey: ResourceKey | RequestKey,
      type: NotificationType | CacheOperation | DocumentCacheOperation,
      key?: string | NotifyKeys | null
    ) => {
      if (cacheKey === identifier && type === 'attributes' && key instanceof Set) {
        batchKeyWasSet = true;
      }
      return (originalNotify as (cacheKey: unknown, type: unknown, key: unknown) => boolean)(cacheKey, type, key);
    }) as typeof store.notifications.notify;

    // a single push that changes multiple attributes on the same record at once,
    // simulating the N*M hot-path (here N=1 record, M=2 changed attributes) called
    // out in https://github.com/emberjs/data/issues/9667
    store.cache.upsert(
      identifier,
      { type: 'user', id: '1', attributes: { name: 'Christopher', username: 'runspired', age: 31 } },
      true
    );

    store.notifications.notify = originalNotify;

    assert.deepEqual(
      seenKeys.sort(),
      ['age', 'name'].sort(),
      'we were notified exactly once for each attribute that actually changed'
    );
    assert.true(
      batchKeyWasSet,
      'the changed-keys Set computed by the cache was passed to notify() as a Set, without being converted to an array first'
    );

    store.notifications.unsubscribe(token);
  });

  test('relationship changes on the same identifier are flushed to `notify` as a single batch', function (assert) {
    const store = new RelationshipTestStore();

    const doc = store.cache.put(
      asStructuredDocument({
        content: {
          data: [
            { type: 'user', id: '1', attributes: { name: 'Chris' } },
            { type: 'user', id: '2', attributes: { name: 'Igor' } },
            { type: 'user', id: '3', attributes: { name: 'Rob' } },
            { type: 'user', id: '4', attributes: { name: 'Rey' } },
          ],
        },
      })
    );
    const identifiers = doc.data as ResourceKey[];
    const identifier = identifiers[0];

    // relationships only notify once they have been "accessed" at least once
    // (there is no point notifying about a change nothing has read yet), so
    // materialize the record and read both relationships first.
    const record = store.peekRecord<User>(identifier);
    assert.equal(record?.bestFriend, null, 'bestFriend starts out empty');
    assert.equal(record?.friends?.length, 0, 'friends starts out empty');

    const seenKeys: string[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string) => {
        if (type === 'relationships' && key) {
          seenKeys.push(key);
        }
      }
    );

    // spy on the underlying NotificationManager#notify to count how many times
    // it is actually invoked for this identifier's 'relationships' namespace.
    // Before this change, `CacheCapabilitiesManager#_flushNotifications` called
    // `notify` once per pending relationship key; now it should call it once
    // per identifier, carrying every pending key for that identifier at once.
    // Also confirm the pending keys `Set<string>` collected by
    // `CacheCapabilitiesManager#_pendingNotifies` is passed to `notify` as a
    // `Set`, not converted to an array first (the relationships flush path
    // already had a `Set` on hand, so there is no reason to convert it).
    let notifyCallCount = 0;
    let batchKeyWasSet = false;
    const originalNotify = store.notifications.notify.bind(store.notifications);
    store.notifications.notify = ((
      cacheKey: ResourceKey | RequestKey,
      type: NotificationType | CacheOperation | DocumentCacheOperation,
      key?: string | NotifyKeys | null
    ) => {
      if (cacheKey === identifier && type === 'relationships') {
        notifyCallCount++;
        if (key instanceof Set) {
          batchKeyWasSet = true;
        }
      }
      return (originalNotify as (cacheKey: unknown, type: unknown, key: unknown) => boolean)(cacheKey, type, key);
    }) as typeof store.notifications.notify;

    // a single upsert that changes two different relationships on the same
    // record at once, simulating the N*M hot-path (here N=1 record, M=2
    // changed relationships) called out in https://github.com/emberjs/data/issues/9667
    store.cache.upsert(
      identifier,
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '2' } },
          friends: {
            data: [
              { type: 'user', id: '3' },
              { type: 'user', id: '4' },
            ],
          },
        },
      },
      true
    );

    store.notifications.notify = originalNotify;

    assert.deepEqual(
      seenKeys.sort(),
      ['bestFriend', 'friends'].sort(),
      'we were notified exactly once for each relationship that actually changed'
    );
    assert.equal(
      notifyCallCount,
      1,
      'both relationship keys were flushed to notify() in a single batched call, not once per key'
    );
    assert.true(
      batchKeyWasSet,
      'the pending-keys Set collected for this identifier was passed to notify() as a Set, without being converted to an array first'
    );

    store.notifications.unsubscribe(token);
  });
});
