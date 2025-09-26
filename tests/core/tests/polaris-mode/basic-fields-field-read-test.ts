import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import type { ReactiveResource, Transformation } from '@warp-drive/core/reactive';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface EditableUser {
  readonly id: string;
  readonly $type: 'user';
  name: string;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
  readonly [Type]: 'user';
}

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
  bestFriend?: User | null;
  readonly [Type]: 'user';
}

module('Reads | basic fields', function (hooks) {
  setupTest(hooks);

  test('we can use simple fields with no `type`', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', { name: 'Rey Skybarker' });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');

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

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          {
            name: 'lastName',
            type: 'string',
            kind: 'field',
          },
          {
            name: 'rank',
            type: 'float',
            kind: 'field',
            options: { precision: 0 },
          },
          {
            name: 'age',
            type: 'float',
            options: { precision: 0 },
            kind: 'field',
          },
          {
            name: 'netWorth',
            type: 'float',
            options: { precision: 2 },
            kind: 'field',
          },
          {
            name: 'coolometer',
            type: 'float',
            kind: 'field',
          },
        ],
      })
    );

    const record = store.createRecord('user', {
      name: 'Rey Skybarker',
      age: 42,
      netWorth: 1_000_000.009,
      coolometer: '100.0',
    }) as User;
    const identifier = recordIdentifierFor(record);

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(record.age, 42, 'age is accessible');
    assert.equal(record.netWorth, 1_000_000.01, 'netWorth is accessible');
    assert.equal(record.coolometer, 100, 'coolometer is accessible');
    assert.equal(record.rank, 0, 'rank is accessible');

    try {
      // @ts-expect-error intentionally have not typed the property on the record
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      record.lastName;
      assert.ok(false, 'should error when accessing a field with an unknown transform');
    } catch (e) {
      assert.equal(
        (e as Error).message,
        DEBUG
          ? `No transformation registered with name 'string' for 'field' field 'lastName'`
          : "Cannot read properties of undefined (reading 'hydrate')",
        'should error when accessing unknown field transform'
      );
    }

    store.schema.registerTransformation({
      serialize(value: string, _options, _record): string {
        return value;
      },
      hydrate(value: string, _options, _record): string {
        return value;
      },
      defaultValue(_options, _identifier) {
        return '';
      },
      [Type]: 'string',
    });

    const resource = store.cache.peek(identifier)!;

    assert.equal(store.cache.getAttr(identifier, 'name'), 'Rey Skybarker', 'cache value for name is correct');
    assert.equal(store.cache.getAttr(identifier, 'age'), '42', 'cache value for age is correct');
    assert.equal(store.cache.getAttr(identifier, 'netWorth'), '1000000.01', 'cache value for netWorth is correct');
    assert.equal(store.cache.getAttr(identifier, 'coolometer'), '100.000', 'cache value for coolometer is correct');
    assert.equal(store.cache.getAttr(identifier, 'rank'), '0', 'cache value for rank is correct');

    assert.equal(resource.type, 'user', 'resource cache type is correct');
    assert.equal(resource.id, null, 'resource cache id is correct');
    assert.equal(resource.attributes?.name, 'Rey Skybarker', 'resource cache value for name is correct');
    assert.equal(resource.attributes?.age, '42', 'resource cache value for age is correct');
    assert.equal(resource.attributes?.netWorth, '1000000.01', 'resource cache value for netWorth is correct');
    assert.equal(resource.attributes?.coolometer, '100.000', 'resource cache value for coolometer is correct');
    assert.equal(resource.attributes?.rank, '0', 'resource cache value for rank is correct');
  });

  test('Record is immutable without calling checkout', async function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [{ name: 'name', kind: 'field' }],
      })
    );

    const immutableRecord = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'Rey Skybarker',
        },
      },
    });

    assert.equal(immutableRecord.id, '1', 'id is accessible');
    assert.equal(immutableRecord.name, 'Rey Skybarker', 'name is accessible');

    assert.throws(
      () => {
        immutableRecord.name = 'Gilfoyle';
      },
      DEBUG
        ? /Error: Cannot set name on user because the ReactiveResource is not editable/
        : /'set' on proxy: trap returned falsish for property 'name'/,
      'name cannot be mutated'
    );

    // Verify address remains unchanged
    assert.equal(immutableRecord.name, 'Rey Skybarker', 'name remains unchanged after failed mutation attempt');

    const editableRecord = await checkout<EditableUser>(immutableRecord);
    editableRecord.name = 'Gilfoyle';

    assert.equal(editableRecord.name, 'Gilfoyle', 'name can be mutated after checkout');

    // Verify cache updates
    const identifier = recordIdentifierFor(editableRecord);
    const cachedResourceData = store.cache.peek(identifier);
    assert.equal(cachedResourceData?.attributes?.name, 'Gilfoyle', 'Cache reflects updated name after checkout');
  });
});
