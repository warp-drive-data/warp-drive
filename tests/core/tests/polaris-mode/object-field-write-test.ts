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
type address = {
  street: string;
  city: string;
  state: string;
  zip: string | number;
};

type User = Readonly<{
  id: string;
  $type: 'user';
  name: string;
  address: address | null;
  [Type]: 'user';
}>;

type EditableUser = {
  readonly id: string;
  readonly $type: 'user';
  name: string;
  address: address | null;
  readonly [Type]: 'user';
};

interface CreateUserType {
  id: string | null;
  $type: 'user';
  name: string | null;
  address: address | null;

  [Type]: 'user';
}

module('Writes | object fields', function (hooks) {
  setupTest(hooks);

  module('Immutability', function () {
    test('we cannot update to a new object', function (assert) {
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
              name: 'address',
              kind: 'object',
            },
          ],
        })
      );

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
            address: {
              street: '123 Main Street',
              city: 'Anytown',
              state: 'NY',
              zip: '12345',
            },
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.deepEqual(
        record.address,
        { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
        'We have the correct address object'
      );
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the object
          record.address = { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' };
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );

      assert.deepEqual(
        record.address,
        { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
        'We have the correct address object'
      );
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
              name: 'address',
              kind: 'object',
            },
          ],
        })
      );
      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
            address: {
              street: '123 Main Street',
              city: 'Anytown',
              state: 'NY',
              zip: '12345',
            },
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
      assert.deepEqual(
        record.address,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct address object'
      );
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the object
          record.address = null;
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );

      assert.deepEqual(
        record.address,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct address object'
      );
    });

    test('we cannot update a single value in the object', function (assert) {
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
              name: 'address',
              kind: 'object',
            },
          ],
        })
      );
      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
            address: { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
          },
        },
      });

      assert.deepEqual(
        record.address,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct address object'
      );
      assert.throws(
        () => {
          record.address!.state = 'NJ';
        },
        DEBUG
          ? /Error: Cannot set read-only property 'state' on ManagedObject/
          : /'set' on proxy: trap returned falsish for property 'state'/
      );
      assert.deepEqual(
        record.address,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct address object'
      );
    });

    test('we cannot assign an object value to another record', function (assert) {
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
              name: 'address',
              kind: 'object',
            },
          ],
        })
      );
      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
            address: {
              street: '123 Main Street',
              city: 'Anytown',
              state: 'NY',
              zip: '12345',
            },
          },
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
      assert.deepEqual(
        record.address,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct address object'
      );
      assert.equal(record.address, record.address, 'We have a stable object reference');
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the object
          record2.address = record.address;
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );
      assert.equal(record2.address, null, 'Record2 address object is not updated');
    });

    test('we cannot edit simple object fields with a `type`', function (assert) {
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
              name: 'address',
              type: 'zip-string-from-int',
              kind: 'object',
            },
          ],
        })
      );

      const ZipStringFromIntTransform: Transformation<address, address> = {
        serialize(value: address, options, _record): address {
          if (typeof value.zip === 'string') {
            return {
              street: value.street,
              city: value.city,
              state: value.state,
              zip: parseInt(value.zip),
            };
          }
          return value;
        },
        hydrate(value: address, _options, _record): address {
          return {
            street: value.street,
            city: value.city,
            state: value.state,
            zip: value.zip?.toString(),
          };
        },
        defaultValue(_options, _identifier) {
          assert.ok(false, 'unexpected defaultValue');
          throw new Error('unexpected defaultValue');
        },
        [Type]: 'zip-string-from-int',
      };
      schema.registerTransformation(ZipStringFromIntTransform);

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'NY',
              zip: 12345,
            },
          },
        },
      });
      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.deepEqual(
        record.address,
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct object members'
      );
      assert.equal(record.address, record.address, 'We have a stable object reference');
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the object
          record.address = {
            street: '456 Elm St',
            city: 'Sometown',
            state: 'NJ',
            zip: '23456',
          };
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );

      assert.deepEqual(
        record.address,
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct object members'
      );
    });

    test('we cannot edit single values in object fields with a `type`', function (assert) {
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
              name: 'address',
              type: 'zip-string-from-int',
              kind: 'object',
            },
          ],
        })
      );

      const ZipStringFromIntTransform: Transformation<address, address> = {
        serialize(value: address, options, _record): address {
          if (typeof value.zip === 'string') {
            return {
              street: value.street,
              city: value.city,
              state: value.state,
              zip: parseInt(value.zip),
            };
          }
          return value;
        },
        hydrate(value: address, _options, _record): address {
          return {
            street: value.street,
            city: value.city,
            state: value.state,
            zip: value.zip?.toString(),
          };
        },
        defaultValue(_options, _identifier) {
          assert.ok(false, 'unexpected defaultValue');
          throw new Error('unexpected defaultValue');
        },
        [Type]: 'zip-string-from-int',
      };
      schema.registerTransformation(ZipStringFromIntTransform);

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'NY',
              zip: 12345,
            },
          },
        },
      });
      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.deepEqual(
        record.address,
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct object members'
      );
      assert.equal(record.address, record.address, 'We have a stable object reference');
      assert.equal(record.address?.zip, '12345', 'zip is accessible');
      assert.throws(
        () => {
          record.address!.zip = '23456';
        },
        DEBUG
          ? /Error: Cannot set read-only property 'zip' on ManagedObject/
          : /'set' on proxy: trap returned falsish for property 'zip'/
      );

      assert.deepEqual(
        record.address,
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'We have the correct object members'
      );
    });
  });

  // Editable tests
  test('we can update to a new object', async function (assert) {
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
            name: 'address',
            kind: 'object',
          },
        ],
      })
    );

    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Pupatine',
          address: {
            street: '123 Main Street',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
        },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);
    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.deepEqual(
      record.address,
      { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
      'We have the correct address object'
    );
    const address = record.address;
    record.address = { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' };
    assert.deepEqual(
      record.address,
      { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' },
      'we have the correct Object members'
    );
    assert.equal(address, record.address, 'Object reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.deepEqual(
      cachedResourceData?.attributes?.address,
      { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' },
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
            name: 'address',
            kind: 'object',
          },
        ],
      })
    );
    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Pupatine',
          address: {
            street: '123 Main Street',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
        },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);
    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.deepEqual(
      record.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct address object'
    );
    record.address = null;
    assert.equal(record.address, null, 'The object is correctly set to null');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);
    assert.deepEqual(cachedResourceData?.attributes?.address, null, 'the cache values are correctly updated');
    record.address = {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    assert.deepEqual(
      record.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct address object'
    );
  });

  test('we can update a single value in the object', async function (assert) {
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
            name: 'address',
            kind: 'object',
          },
        ],
      })
    );
    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Pupatine',
          address: { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
        },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);
    assert.deepEqual(
      record.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct address object'
    );
    const address = record.address;
    record.address!.state = 'NJ';
    assert.deepEqual(
      record.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NJ',
        zip: '12345',
      },
      'We have the correct address object'
    );
    assert.equal(address, record.address, 'Object reference does not change');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);
    assert.deepEqual(
      cachedResourceData?.attributes?.address,
      { street: '123 Main Street', city: 'Anytown', state: 'NJ', zip: '12345' },
      'the cache values are correctly updated'
    );
  });

  test('we can assign an object value to another record', async function (assert) {
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
            name: 'address',
            kind: 'object',
          },
        ],
      })
    );
    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Pupatine',
          address: {
            street: '123 Main Street',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
        },
      },
    });
    const immutableRecord2 = store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: { name: 'Luke Skybarker' },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);
    const record2 = await checkout<EditableUser>(immutableRecord2);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.equal(record2.id, '2', 'id is accessible');
    assert.equal(record2.$type, 'user', '$type is accessible');
    assert.equal(record2.name, 'Luke Skybarker', 'name is accessible');
    assert.deepEqual(
      record.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct address object'
    );
    assert.equal(record.address, record.address, 'We have a stable object reference');
    const address = record.address;
    record2.address = record.address;
    assert.deepEqual(
      record2.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct address object'
    );

    assert.equal(address, record.address, 'Object reference does not change');
    assert.notEqual(address, record2.address, 'We have a new object reference');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record2);
    const cachedResourceData = store.cache.peek(identifier);
    assert.deepEqual(
      cachedResourceData?.attributes?.address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'the cache values are correctly updated'
    );
  });

  test('we can edit simple object fields with a `type`', function (assert) {
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
            name: 'address',
            type: 'zip-string-from-int',
            kind: 'object',
          },
        ],
      })
    );

    const ZipStringFromIntTransform: Transformation<address, address> = {
      serialize(value: address, options, _record): address {
        if (typeof value.zip === 'string') {
          return {
            street: value.street,
            city: value.city,
            state: value.state,
            zip: parseInt(value.zip),
          };
        }
        return value;
      },
      hydrate(value: address, _options, _record): address {
        return {
          street: value.street,
          city: value.city,
          state: value.state,
          zip: value.zip?.toString(),
        };
      },
      defaultValue(_options, _identifier) {
        assert.ok(false, 'unexpected defaultValue');
        throw new Error('unexpected defaultValue');
      },
      [Type]: 'zip-string-from-int',
    };
    schema.registerTransformation(ZipStringFromIntTransform);

    const sourceAddress = {
      street: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    const record = store.createRecord<CreateUserType>('user', { name: 'Rey Skybarker', address: sourceAddress });
    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.deepEqual(
      record.address,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct object members'
    );
    assert.equal(record.address, record.address, 'We have a stable object reference');
    assert.notEqual(record.address, sourceAddress);
    const address = record.address;
    record.address = {
      street: '456 Elm St',
      city: 'Sometown',
      state: 'NJ',
      zip: '23456',
    };
    assert.deepEqual(
      record.address,
      {
        street: '456 Elm St',
        city: 'Sometown',
        state: 'NJ',
        zip: '23456',
      },
      'We have the correct object members'
    );
    assert.equal(address, record.address, 'object reference does not change');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);
    assert.deepEqual(
      cachedResourceData?.attributes?.address,
      {
        street: '456 Elm St',
        city: 'Sometown',
        state: 'NJ',
        zip: 23456,
      },
      'the cache values are correct for the object field'
    );
    assert.deepEqual(
      sourceAddress,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'we did not mutate the source object'
    );
  });

  test('we can edit single values in object fields with a `type`', function (assert) {
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
            name: 'address',
            type: 'zip-string-from-int',
            kind: 'object',
          },
        ],
      })
    );

    const ZipStringFromIntTransform: Transformation<address, address> = {
      serialize(value: address, options, _record): address {
        if (typeof value.zip === 'string') {
          return {
            street: value.street,
            city: value.city,
            state: value.state,
            zip: parseInt(value.zip),
          };
        }
        return value;
      },
      hydrate(value: address, _options, _record): address {
        return {
          street: value.street,
          city: value.city,
          state: value.state,
          zip: value.zip?.toString(),
        };
      },
      defaultValue(_options, _identifier) {
        assert.ok(false, 'unexpected defaultValue');
        throw new Error('unexpected defaultValue');
      },
      [Type]: 'zip-string-from-int',
    };
    schema.registerTransformation(ZipStringFromIntTransform);

    const sourceAddress = {
      street: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    const record = store.createRecord<CreateUserType>('user', { name: 'Rey Skybarker', address: sourceAddress });
    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.deepEqual(
      record.address,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'We have the correct object members'
    );
    assert.equal(record.address, record.address, 'We have a stable object reference');
    assert.notEqual(record.address, sourceAddress, 'we do not keep the source object reference');
    const address = record.address;
    assert.equal(record.address?.zip, '12345', 'zip is accessible');
    record.address!.zip = '23456';

    assert.deepEqual(
      record.address,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '23456',
      },
      'We have the correct object members'
    );
    assert.equal(address, record.address, 'object reference does not change');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);
    assert.deepEqual(
      cachedResourceData?.attributes?.address,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: 23456,
      },
      'the cache values are correct for the object field'
    );
    assert.deepEqual(
      sourceAddress,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'we did not mutate the source object'
    );
  });

  module('Cache Remote Values', function () {
    test('Cache remote values are retrievable after update', async function (assert) {
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
              name: 'address',
              kind: 'object',
            },
          ],
        })
      );

      const immutableRecord = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
            address: {
              street: '123 Main Street',
              city: 'Anytown',
              state: 'NY',
              zip: '12345',
            },
          },
        },
      });

      const record = await checkout<EditableUser>(immutableRecord);
      assert.deepEqual(
        record.address,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'address is correct pre-update'
      );

      record.address = {
        street: '456 Elm Street',
        city: 'Sometown',
        state: 'NJ',
        zip: '23456',
      };

      assert.deepEqual(
        record.address,
        {
          street: '456 Elm Street',
          city: 'Sometown',
          state: 'NJ',
          zip: '23456',
        },
        'address is correct post-update'
      );
      const identifier = recordIdentifierFor(record);
      const cachedAddress = store.cache.getAttr(identifier, 'address');
      assert.deepEqual(
        cachedAddress,
        {
          street: '456 Elm Street',
          city: 'Sometown',
          state: 'NJ',
          zip: '23456',
        },
        'address is correct in cache'
      );
      const remoteAddress = store.cache.getRemoteAttr(identifier, 'address');
      assert.deepEqual(
        remoteAddress,
        {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'remote address is correct in cache'
      );
    });
  });
});
