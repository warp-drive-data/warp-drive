import type { NotificationType } from '@warp-drive/core';
import { Store } from '@warp-drive/core';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { StructuredDataDocument } from '@warp-drive/core/types/request';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

import { TestSchema } from '../../utils/schema';

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

function asStructuredDocument<T>(doc: {
  request?: { url: string; cacheOptions?: { key?: string } };
  content: T;
}): StructuredDataDocument<T> {
  return doc as unknown as StructuredDataDocument<T>;
}

type Call = [type: NotificationType, key: string | undefined];

module('Integration | NotificationManager batch notifications', function () {
  test('notify(identifier, "attributes", keys[]) delivers the same sequence of notifications as calling notify once per key', function (assert) {
    const store = new TestStore();

    const identifierA = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const identifierB = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });

    const batchCalls: Call[] = [];
    const individualCalls: Call[] = [];

    const tokenA = store.notifications.subscribe(
      identifierA,
      (_key: ResourceKey, type: NotificationType, key?: string) => {
        batchCalls.push([type, key]);
      }
    );
    const tokenB = store.notifications.subscribe(
      identifierB,
      (_key: ResourceKey, type: NotificationType, key?: string) => {
        individualCalls.push([type, key]);
      }
    );

    // the new batch calling convention: a single notify() call carrying multiple keys
    store.notifications.notify(identifierA, 'attributes', ['name', 'username', 'age']);

    // the pre-existing calling convention: one notify() call per key
    store.notifications.notify(identifierB, 'attributes', 'name');
    store.notifications.notify(identifierB, 'attributes', 'username');
    store.notifications.notify(identifierB, 'attributes', 'age');

    assert.deepEqual(
      batchCalls,
      [
        ['attributes', 'name'],
        ['attributes', 'username'],
        ['attributes', 'age'],
      ],
      'the batch call delivered one notification per key, in order'
    );
    assert.deepEqual(
      batchCalls,
      individualCalls,
      'the batch call produced the exact same subscriber notifications as the equivalent individual calls'
    );

    store.notifications.unsubscribe(tokenA);
    store.notifications.unsubscribe(tokenB);
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

    // a single push that changes multiple attributes on the same record at once,
    // simulating the N*M hot-path (here N=1 record, M=2 changed attributes) called
    // out in https://github.com/emberjs/data/issues/9667
    store.cache.upsert(
      identifier,
      { type: 'user', id: '1', attributes: { name: 'Christopher', username: 'runspired', age: 31 } },
      true
    );

    assert.deepEqual(
      seenKeys.sort(),
      ['age', 'name'].sort(),
      'we were notified exactly once for each attribute that actually changed'
    );

    store.notifications.unsubscribe(token);
  });
});
