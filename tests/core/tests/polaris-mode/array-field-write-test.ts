import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import type { Transformation } from '@warp-drive/core/reactive';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

type EditableUser = {
  readonly id: string;
  readonly $type: 'user';
  name: string;
  favoriteNumbers: string[] | null;
  readonly [Type]: 'user';
};

type User = Readonly<{
  id: string;
  $type: 'user';
  name: string;
  favoriteNumbers: string[] | null;
  readonly [Type]: 'user';
}>;
interface CreateUserType {
  id: string | null;
  $type: 'user';
  name: string | null;
  favoriteNumbers: string[] | null;
  readonly [Type]: 'user';
}

module('Writes | array fields', function (hooks) {
  setupTest(hooks);

  module('Immutability', function () {
    test('we cannot update to a new array', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the array
          record.favoriteNumbers = ['3', '4'];
        },
        DEBUG
          ? /Cannot set favoriteNumbers on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'favoriteNumbers'/
      );
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot update to null', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the array
          record.favoriteNumbers = null;
        },
        DEBUG
          ? /Cannot set favoriteNumbers on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'favoriteNumbers'/
      );
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot update a single value in the array', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.throws(
        () => {
          record.favoriteNumbers![0] = '3';
        },
        DEBUG
          ? /Cannot set 0 on favoriteNumbers because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property '0'/
      );
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot push a new value on to the array', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(() => {
        record.favoriteNumbers?.push('3');
      }, /Mutating this array via push is not allowed because the ReactiveResource is not editable/);

      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot pop a value off of the array', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(() => {
        record.favoriteNumbers?.pop();
      }, /Mutating this array via pop is not allowed because the ReactiveResource is not editable/);
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot unshift a value on to the array', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(() => {
        record.favoriteNumbers?.unshift('3');
      }, /Mutating this array via unshift is not allowed because the ReactiveResource is not editable/);
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot shift a value off of the array', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(() => {
        record.favoriteNumbers?.shift();
      }, /Mutating this array via shift is not allowed because the ReactiveResource is not editable/);
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot assign an array value to another record', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
        },
      });

      const record2 = store.push<User>({
        data: {
          type: 'user',
          id: '2',
          attributes: { name: 'Luke Skybarker' },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.equal(record2.id, '2', 'id is accessible');
      assert.equal(record2.$type, 'user', '$type is accessible');
      assert.equal(record2.name, 'Luke Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the array
          record2.favoriteNumbers = record.favoriteNumbers;
        },
        DEBUG
          ? /Cannot set favoriteNumbers on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'favoriteNumbers'/
      );

      assert.equal(record2.favoriteNumbers, null, 'the second record array has not been updated');
    });

    test('we cannot edit simple array fields with a `type`', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Skybarker', favoriteNumbers: [1, 2] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers!.slice(), ['1', '2'], 'We have the correct array members');

      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');

      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the array
          record.favoriteNumbers = ['3', '4'];
        },
        DEBUG
          ? /Cannot set favoriteNumbers on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'favoriteNumbers'/
      );

      assert.deepEqual(record.favoriteNumbers!.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot edit single values in array fields with a `type`', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Skybarker', favoriteNumbers: [1, 2] },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');

      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');

      assert.throws(
        () => {
          record.favoriteNumbers![0] = '3';
        },
        DEBUG
          ? /Cannot set 0 on favoriteNumbers because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property '0'/
      );

      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we cannot push a new value on to array fields with a `type`', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Skybarker', favoriteNumbers: [1, 2] },
        },
      });
      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');

      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');

      assert.throws(() => {
        record.favoriteNumbers?.push('3');
      }, /Mutating this array via push is not allowed because the ReactiveResource is not editable/);

      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });

    test('we can pop a value off of an array fields with a `type`', function (assert) {
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

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Rey Skybarker', favoriteNumbers: [1, 2] },
        },
      });
      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');

      assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');

      assert.throws(() => {
        record.favoriteNumbers?.pop();
      }, /Mutating this array via pop is not allowed because the ReactiveResource is not editable/);

      assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    });
  });

  // Editable tests
  test('we can update to a new array', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    const favoriteNumbers = record.favoriteNumbers;
    record.favoriteNumbers = ['3', '4'];
    assert.deepEqual(record.favoriteNumbers.slice(), ['3', '4'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier)!;

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['3', '4'],
      'the cache values are correctly updated'
    );
  });

  test('we can update to null', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    record.favoriteNumbers = null;
    assert.equal(record.favoriteNumbers, null, 'The array is correctly set to null');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(cachedResourceData?.attributes?.favoriteNumbers, null, 'the cache values are correctly updated');
    record.favoriteNumbers = ['3', '4'];
    assert.deepEqual(record.favoriteNumbers.slice(), ['3', '4'], 'We have the correct array members');
  });

  test('we can update a single value in the array', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);

    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    const favoriteNumbers = record.favoriteNumbers;
    record.favoriteNumbers![0] = '3';
    assert.deepEqual(record.favoriteNumbers?.slice(), ['3', '2'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['3', '2'],
      'the cache values are correctly updated'
    );
  });

  test('we can push a new value on to the array', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    const favoriteNumbers = record.favoriteNumbers;
    record.favoriteNumbers?.push('3');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2', '3'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['1', '2', '3'],
      'the cache values are correctly updated'
    );
  });

  test('we can pop a value off of the array', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    const favoriteNumbers = record.favoriteNumbers;
    const num = record.favoriteNumbers?.pop();
    assert.equal(num, '2', 'the correct value was popped off the array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(cachedResourceData?.attributes?.favoriteNumbers, ['1'], 'the cache values are correctly updated');
  });

  test('we can unshift a value on to the array', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    const favoriteNumbers = record.favoriteNumbers;
    record.favoriteNumbers?.unshift('3');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['3', '1', '2'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['3', '1', '2'],
      'the cache values are correctly updated'
    );
  });

  test('we can shift a value off of the array', async function (assert) {
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

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    const favoriteNumbers = record.favoriteNumbers;
    const num = record.favoriteNumbers?.shift();
    assert.equal(num, '1', 'the correct value was popped off the array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['2'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(cachedResourceData?.attributes?.favoriteNumbers, ['2'], 'the cache values are correctly updated');
  });

  test('we can assign an array value to another record', async function (assert) {
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

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine', favoriteNumbers: ['1', '2'] },
      },
    });

    const record2Immutable = store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: { name: 'Luke Skybarker' },
      },
    });
    const record2 = await checkout<EditableUser>(record2Immutable);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.equal(record2.id, '2', 'id is accessible');
    assert.equal(record2.$type, 'user', '$type is accessible');
    assert.equal(record2.name, 'Luke Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.favoriteNumbers), 'we can access favoriteNumber array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    const favoriteNumbers = record.favoriteNumbers;
    record2.favoriteNumbers = record.favoriteNumbers;
    assert.deepEqual(record2.favoriteNumbers?.slice(), ['1', '2'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');
    assert.notEqual(favoriteNumbers, record2.favoriteNumbers, 'This is weird');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record2);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      ['1', '2'],
      'the cache values are correctly updated'
    );
  });

  test('we can edit simple array fields with a `type`', function (assert) {
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
    assert.deepEqual(record.favoriteNumbers!.slice(), ['1', '2'], 'We have the correct array members');

    assert.equal(record.favoriteNumbers, record.favoriteNumbers, 'We have a stable array reference');
    assert.notEqual(record.favoriteNumbers, sourceArray);

    const favoriteNumbers = record.favoriteNumbers;

    record.favoriteNumbers = ['3', '4'];
    assert.deepEqual(record.favoriteNumbers.slice(), ['3', '4'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      [3, 4],
      'the cache values are correct for the array field'
    );
    assert.deepEqual(sourceArray, ['1', '2'], 'we did not mutate the source array');
  });

  test('we can edit single values in array fields with a `type`', function (assert) {
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

    const favoriteNumbers = record.favoriteNumbers;

    record.favoriteNumbers![0] = '3';
    assert.deepEqual(record.favoriteNumbers?.slice(), ['3', '2'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      [3, 2],
      'the cache values are correct for the array field'
    );
    assert.deepEqual(sourceArray, ['1', '2'], 'we did not mutate the source array');
  });

  test('we can push a new value on to array fields with a `type`', function (assert) {
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

    const favoriteNumbers = record.favoriteNumbers;

    record.favoriteNumbers?.push('3');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1', '2', '3'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      [1, 2, 3],
      'the cache values are correct for the array field'
    );
    assert.deepEqual(sourceArray, ['1', '2'], 'we did not mutate the source array');
  });

  test('we can pop a value off of an array fields with a `type`', function (assert) {
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

    const favoriteNumbers = record.favoriteNumbers;

    const val = record.favoriteNumbers?.pop();
    assert.equal(val, '2', 'the correct value was popped off the array');
    assert.deepEqual(record.favoriteNumbers?.slice(), ['1'], 'We have the correct array members');
    assert.equal(favoriteNumbers, record.favoriteNumbers, 'Array reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      [1],
      'the cache values are correct for the array field'
    );
    assert.deepEqual(sourceArray, ['1', '2'], 'we did not mutate the source array');
  });
});
