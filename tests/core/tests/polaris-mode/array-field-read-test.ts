import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import type { Transformation } from '@warp-drive/core/reactive';
import { withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface CreateUserType {
  id: string | null;
  $type: 'user';
  name: string | null;
  favoriteNumbers: string[] | null;
  [Type]: 'user';
}

module('Reads | array fields', function (hooks) {
  setupTest(hooks);

  test('we can use simple array fields with no `type`', function (assert) {
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
          {
            name: 'favoriteNumbers',
            kind: 'array',
          },
        ],
      })
    );

    const sourceArray = ['1', '2'];
    const record = store.createRecord<CreateUserType>('user', { name: 'Rey Skybarker', favoriteNumbers: sourceArray });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    assert.notEqual(record.favoriteNumbers, sourceArray);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.notEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      sourceArray,
      'with no transform we will still divorce the array reference'
    );
    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['1', '2'],
      'the cache values are correct for the array field'
    );
  });

  test('we can use simple array fields with a `type`', function (assert) {
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
          {
            name: 'favoriteNumbers',
            type: 'string-from-int',
            kind: 'array',
          },
        ],
      })
    );

    const StringFromIntTransform: Transformation<number, string> = {
      serialize(value: string, options, _record): number {
        return parseInt(value);
      },
      hydrate(value: number, _options, _record): string {
        return value.toString();
      },
      defaultValue(_options, _identifier) {
        assert.ok(false, 'unexpected defaultValue');
        throw new Error('unexpected defaultValue');
      },
      [Type]: 'string-from-int',
    };

    schema.registerTransformation(StringFromIntTransform);

    const sourceArray = ['1', '2'];
    const record = store.createRecord<CreateUserType>('user', { name: 'Rey Skybarker', favoriteNumbers: sourceArray });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    assert.notEqual(record.favoriteNumbers, sourceArray);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.notEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      sourceArray,
      'with no transform we will still divorce the array reference'
    );
    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      [1, 2],
      'the cache values are correct for the array field'
    );
    assert.deepEqual(sourceArray, ['1', '2'], 'we did not mutate the source array');
  });

  test('we can have null values for simple array fields', function (assert) {
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
          {
            name: 'favoriteNumbers',
            kind: 'array',
          },
        ],
      })
    );

    const record = store.createRecord<CreateUserType>('user', { name: 'Rey Skybarker', favoriteNumbers: null });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(record.favoriteNumbers, null);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.equal(cachedResourceData?.attributes?.favoriteNumbers, null, 'the value in the cache is null');
    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      null,
      'the cache values are correct for the array field'
    );
  });

  test('we can update to null values for simple array fields', function (assert) {
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
          {
            name: 'favoriteNumbers',
            kind: 'array',
          },
        ],
      })
    );

    const sourceArray = ['1', '2'];
    const record = store.createRecord<CreateUserType>('user', { name: 'Rey Skybarker', favoriteNumbers: sourceArray });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    assert.notEqual(record.favoriteNumbers, sourceArray);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.notEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      sourceArray,
      'with no transform we will still divorce the array reference'
    );
    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['1', '2'],
      'the cache values are correct for the array field'
    );

    record.favoriteNumbers = null;
    assert.equal(record.favoriteNumbers, null);

    // test that the data entered the cache properly
    const cachedResourceData2 = store.cache.peek(identifier);

    assert.equal(cachedResourceData2?.attributes?.favoriteNumbers, null, 'the value in the cache is null');
    assert.deepEqual(
      cachedResourceData2?.attributes?.favoriteNumbers,
      null,
      'the cache values are correct for the array field'
    );
  });
});
