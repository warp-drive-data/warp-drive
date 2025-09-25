import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import type { ReactiveResource, Transformation } from '@warp-drive/core/reactive';
import { registerDerivations, withDefaults } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

interface User {
  id: string | null;
  $type: 'user';
  rawNetWorth: string;
  netWorth: number;
  [Type]: 'user';
}

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

module('Reads | Alias fields', function (hooks) {
  setupTest(hooks);

  test('we can use simple fields with a `type`', function (assert) {
    const store = new Store();
    const { schema } = store;

    const FloatTransform: Transformation<string | number, number> = {
      serialize(value: string | number, options: { precision?: number } | null, _record: ReactiveResource): string {
        return typeof value === 'number'
          ? value.toFixed(options?.precision ?? 3)
          : Number(value).toFixed(options?.precision ?? 3);
      },
      hydrate(value: string, _options: { precision?: number } | null, _record: ReactiveResource): number {
        if (value === undefined || value === null) {
          return 0;
        }
        return Number(value);
      },
      defaultValue(_options: { precision?: number } | null, _identifier: ResourceKey): string {
        const v = 0;
        return v.toFixed(_options?.precision ?? 3);
      },
      [Type]: 'float',
    };

    schema.registerTransformation(FloatTransform);
    registerDerivations(schema);

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'rawNetWorth',
            kind: 'field',
          },
          {
            kind: 'alias',
            name: 'netWorth',
            type: null,
            options: {
              name: 'rawNetWorth',
              kind: 'field',
              type: 'float',
              options: { precision: 2 },
            },
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', {
      rawNetWorth: '1000000.009',
    });
    const identifier = recordIdentifierFor(record);
    const resource = store.cache.peek(identifier)!;

    assert.equal(record.rawNetWorth, '1000000.009', 'netWorth is accessible in raw form');
    assert.equal(record.netWorth, 1_000_000.009, 'netWorth is accessible in numeric form');
    assert.equal(store.cache.getAttr(identifier, 'rawNetWorth'), '1000000.009', 'cache value for netWorth is correct');
    const rawCache = store.cache.peek(identifier);
    const current = Object.assign({}, rawCache?.attributes);

    assert.false('netWorth' in current, 'not caching the alias field');
    assert.equal(current.netWorth, undefined, 'not caching the alias field');
    assert.equal(resource.attributes?.rawNetWorth, '1000000.009', 'resource cache value for rawNetWorth is correct');
    assert.equal(resource.attributes?.netWorth, undefined, 'resource cache value for netWorth is correct');

    const record2 = store.createRecord<User>('user', {
      netWorth: 1_000_000.009,
    });
    const identifier2 = recordIdentifierFor(record2);
    const resource2 = store.cache.peek(identifier2)!;

    assert.equal(record2.rawNetWorth, '1000000.01', 'netWorth is accessible in raw form');
    assert.equal(record2.netWorth, 1_000_000.01, 'netWorth is accessible in numeric form');
    assert.equal(store.cache.getAttr(identifier2, 'rawNetWorth'), '1000000.01', 'cache value for netWorth is correct');

    const rawCache2 = store.cache.peek(identifier2);
    const current2 = Object.assign({}, rawCache2?.attributes);
    assert.false('netWorth' in current2, 'not caching the alias field');
    assert.equal(current2.netWorth, undefined, 'not caching the alias field');
    assert.equal(resource2.attributes?.rawNetWorth, '1000000.01', 'resource cache value for rawNetWorth is correct');
    assert.equal(resource2.attributes?.netWorth, undefined, 'resource cache value for netWorth is correct');
  });
});
