import EmberObject from '@ember/object';
import { setOwner } from '@ember/owner';

import { recordIdentifierFor } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import type { Transformation } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
}

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Legacy | Reads | basic fields', function (hooks) {
  setupTest(hooks);

  test('we can use simple fields with no `type`', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord('user', { name: 'Rey Skybarker' }) as User;

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(
      (record.constructor as { modelName?: string }).modelName,
      'user',
      'constructor.modelName is accessible'
    );

    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');

    if (DEBUG) {
      try {
        // @ts-expect-error intentionally accessing unknown field
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        record.lastName;
        assert.ok(false, 'should error when accessing unknown field');
      } catch (e) {
        assert.equal(
          (e as Error).message,
          'No field named lastName on user',
          'should error when accessing unknown field'
        );
      }
    }
  });

  test('we can use simple fields with a `type`', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    this.owner.register(
      'transform:float',
      class extends EmberObject {
        serialize() {
          assert.ok(false, 'unexpected legacy serialize');
        }
        deserialize(v: number | string | null) {
          assert.ok(false, 'unexpected legacy deserialize');
        }
      }
    );

    const FloatTransform: Transformation<string | number, number> = {
      serialize(value: string | number, options: { precision?: number } | null, _record: unknown): never {
        assert.ok(false, 'unexpected serialize');
        throw new Error('unexpected serialize');
      },
      hydrate(value: string, _options: { precision?: number } | null, _record: unknown): number {
        assert.ok(false, 'unexpected hydrate');
        throw new Error('unexpected hydrate');
      },
      defaultValue(_options: { precision?: number } | null, _identifier: ResourceKey): string {
        assert.ok(false, 'unexpected defaultValue');
        throw new Error('unexpected defaultValue');
      },
      [Type]: 'float',
    };

    schema.registerTransformation(FloatTransform);

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'lastName',
            type: 'string',
            kind: 'attribute',
          },
          {
            name: 'rank',
            type: 'float',
            kind: 'attribute',
            options: { precision: 0, defaultValue: 0 },
          },
          {
            name: 'age',
            type: 'float',
            options: { precision: 0, defaultValue: 0 },
            kind: 'attribute',
          },
          {
            name: 'netWorth',
            type: 'float',
            options: { precision: 2, defaultValue: 0 },
            kind: 'attribute',
          },
          {
            name: 'coolometer',
            type: 'float',
            options: { defaultValue: 0 },
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord('user', {
      name: 'Rey Skybarker',
      age: 42,
      netWorth: 1_000_000.009,
      coolometer: 100.0,
    }) as User;
    const identifier = recordIdentifierFor(record);

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(
      (record.constructor as { modelName?: string }).modelName,
      'user',
      'constructor.modelName is accessible'
    );
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(record.age, 42, 'age is accessible');
    assert.equal(record.netWorth, 1_000_000.009, 'netWorth is accessible');
    assert.equal(record.coolometer, 100.0, 'coolometer is accessible');
    assert.equal(record.rank, 0, 'rank is accessible');
    // @ts-expect-error intentionally have not typed the property on the record
    assert.equal(record.lastName, undefined, 'lastName is accessible even though its transform does not exist');

    const resource = store.cache.peek(identifier)!;

    assert.equal(store.cache.getAttr(identifier, 'name'), 'Rey Skybarker', 'cache value for name is correct');
    assert.equal(store.cache.getAttr(identifier, 'age'), 42, 'cache value for age is correct');
    assert.equal(store.cache.getAttr(identifier, 'netWorth'), 1_000_000.009, 'cache value for netWorth is correct');
    assert.equal(store.cache.getAttr(identifier, 'coolometer'), 100.0, 'cache value for coolometer is correct');
    assert.equal(store.cache.getAttr(identifier, 'rank'), 0, 'cache value for rank is correct');

    assert.equal(resource.type, 'user', 'resource cache type is correct');
    assert.equal(resource.id, null, 'resource cache id is correct');
    assert.equal(resource.attributes?.name, 'Rey Skybarker', 'resource cache value for name is correct');
    assert.equal(resource.attributes?.age, 42, 'resource cache value for age is correct');
    assert.equal(resource.attributes?.netWorth, 1_000_000.009, 'resource cache value for netWorth is correct');
    assert.equal(resource.attributes?.coolometer, 100.0, 'resource cache value for coolometer is correct');
    assert.equal(resource.attributes?.rank, 0, 'resource cache value for rank is correct');
  });
});
