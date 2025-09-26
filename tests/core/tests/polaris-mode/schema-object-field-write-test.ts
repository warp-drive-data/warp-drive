import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
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

type business = {
  name: string;
  address?: address;
  addresses?: address[];
};
type User = Readonly<{
  id: string;
  $type: 'user';
  name: string;
  address: address | null;
  business: business | null;
  [Type]: 'user';
}>;

type EditableUser = {
  readonly id: string;
  readonly $type: 'user';
  name: string;
  address: address | null;
  business: business | null;
  [Type]: 'user';
};

module('Writes | schema-object fields', function (hooks) {
  setupTest(hooks);

  module('immutability', function () {
    test('we cannot update to a new object', function (assert) {
      const store = new Store();
      const { schema } = store;

      schema.registerResource({
        identity: null,
        type: 'address',
        fields: [
          {
            name: 'street',
            kind: 'field',
          },
          {
            name: 'city',
            kind: 'field',
          },
          {
            name: 'state',
            kind: 'field',
          },
          {
            name: 'zip',
            kind: 'field',
          },
        ],
      });
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
              kind: 'schema-object',
              type: 'address',
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
      assert.satisfies(
        record.address,
        { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
        'We have the correct address object'
      );
      assert.throws(
        () => {
          // @ts-expect-error we are testing the immutability of the object
          record.address = { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' };
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );
      assert.satisfies(
        record.address,
        { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
        'we have the correct Object members'
      );
    });

    test('we cannot update to null', function (assert) {
      const store = new Store();
      const { schema } = store;
      schema.registerResource({
        identity: null,
        type: 'address',
        fields: [
          {
            name: 'street',
            kind: 'field',
          },
          {
            name: 'city',
            kind: 'field',
          },
          {
            name: 'state',
            kind: 'field',
          },
          {
            name: 'zip',
            kind: 'field',
          },
        ],
      });
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
              kind: 'schema-object',
              type: 'address',
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
      assert.satisfies(
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
          // @ts-expect-error we are testing the immutability of the object
          record.address = null;
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );

      assert.satisfies(
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
      schema.registerResource({
        identity: null,
        type: 'address',
        fields: [
          {
            name: 'street',
            kind: 'field',
          },
          {
            name: 'city',
            kind: 'field',
          },
          {
            name: 'state',
            kind: 'field',
          },
          {
            name: 'zip',
            kind: 'field',
          },
        ],
      });
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
              kind: 'schema-object',
              type: 'address',
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
      assert.satisfies(
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
          ? /Error: Cannot set state on address because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'state'/
      );
      assert.satisfies(
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
      schema.registerResource({
        identity: null,
        type: 'address',
        fields: [
          {
            name: 'street',
            kind: 'field',
          },
          {
            name: 'city',
            kind: 'field',
          },
          {
            name: 'state',
            kind: 'field',
          },
          {
            name: 'zip',
            kind: 'field',
          },
        ],
      });
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
              kind: 'schema-object',
              type: 'address',
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
      assert.satisfies(
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
          // @ts-expect-error we are testing the immutability of the object
          record2.address = record.address;
        },
        DEBUG
          ? /Error: Cannot set address on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );

      assert.equal(record2.address, null, 'We have the correct address object');
    });

    test('we cannot edit nested schema-object fields', function (assert) {
      const store = new Store();
      const { schema } = store;

      schema.registerResource({
        identity: null,
        type: 'address',
        fields: [
          {
            name: 'street',
            kind: 'field',
          },
          {
            name: 'city',
            kind: 'field',
          },
          {
            name: 'state',
            kind: 'field',
          },
          {
            name: 'zip',
            kind: 'field',
          },
        ],
      });
      schema.registerResource({
        identity: null,
        type: 'business',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          {
            name: 'address',
            type: 'address',
            kind: 'schema-object',
          },
        ],
      });
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
              type: 'address',
              kind: 'schema-object',
            },
            {
              name: 'business',
              type: 'business',
              kind: 'schema-object',
            },
          ],
        })
      );

      const sourceAddress: address = {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      };
      const sourceBusinessAddress: address = {
        street: '456 Elm St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      };
      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            address: sourceAddress,
            business: { name: 'Acme', address: sourceBusinessAddress },
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.satisfies(
        record.address,
        { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' },
        'we can access address object'
      );
      assert.equal(record.address, record.address, 'We have a stable object reference');
      assert.notEqual(record.address, sourceAddress);
      assert.equal(record.business?.name, 'Acme');
      assert.satisfies(record.business?.address, { street: '456 Elm St', city: 'Anytown', state: 'NY', zip: '12345' });

      // test that the data entered the cache properly
      const identifier = recordIdentifierFor(record);
      const cachedResourceData = store.cache.peek(identifier);

      assert.satisfies(
        cachedResourceData?.attributes?.address as address,
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        'the cache values are correct for the object field'
      );
      assert.satisfies(
        cachedResourceData?.attributes?.business as business,
        {
          name: 'Acme',
          address: {
            street: '456 Elm St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
        },
        'the cache values are correct for a nested object field'
      );
      assert.throws(
        () => {
          record.business!.address = { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' };
        },
        DEBUG
          ? /Error: Cannot set address on business because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'address'/
      );

      assert.satisfies(
        record.business?.address,
        { street: '456 Elm St', city: 'Anytown', state: 'NY', zip: '12345' },
        'we can access nested address object'
      );
    });

    test('we cannot edit nested schema-array fields inside a schema-object', function (assert) {
      const store = new Store();
      const { schema } = store;

      schema.registerResource({
        identity: null,
        type: 'address',
        fields: [
          {
            name: 'street',
            kind: 'field',
          },
          {
            name: 'city',
            kind: 'field',
          },
          {
            name: 'state',
            kind: 'field',
          },
          {
            name: 'zip',
            kind: 'field',
          },
        ],
      });
      schema.registerResource({
        identity: null,
        type: 'business',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          {
            name: 'addresses',
            type: 'address',
            kind: 'schema-array',
          },
        ],
      });
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
              type: 'address',
              kind: 'schema-object',
            },
            {
              name: 'business',
              type: 'business',
              kind: 'schema-object',
            },
          ],
        })
      );
      const sourceAddress: address = {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      };
      const sourceBusinessAddress1: address = {
        street: '456 Elm St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      };
      const sourceBusinessAddress2: address = {
        street: '789 Oak St',
        city: 'Sometown',
        state: 'NJ',
        zip: '23456',
      };
      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            address: sourceAddress,
            business: { name: 'Acme', addresses: [sourceBusinessAddress1, sourceBusinessAddress2] },
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.satisfies(
        record.address,
        { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' },
        'we can access address object'
      );
      assert.equal(record.address, record.address, 'We have a stable object reference');
      assert.equal(record.business?.name, 'Acme');
      assert.satisfies(record.business?.addresses, [
        { street: '456 Elm St', city: 'Anytown', state: 'NY', zip: '12345' },
        { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' },
      ]);
      assert.equal(record.business?.addresses, record.business?.addresses, 'We have a stable array reference');
      assert.throws(
        () => {
          record.business!.addresses![0] = { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' };
        },
        DEBUG
          ? /Error: Cannot set 0 on addresses because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property '0'/
      );
      assert.satisfies(
        record.business?.addresses,
        [
          { street: '456 Elm St', city: 'Anytown', state: 'NY', zip: '12345' },
          { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' },
        ],
        'we can access nested address object'
      );
    });
  });

  test('we can update to a new object', async function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
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
            kind: 'schema-object',
            type: 'address',
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
    assert.satisfies(
      record.address,
      { street: '123 Main Street', city: 'Anytown', state: 'NY', zip: '12345' },
      'We have the correct address object'
    );
    const address = record.address;
    record.address = { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' };
    assert.satisfies(
      record.address,
      { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' },
      'we have the correct Object members'
    );
    assert.equal(address, record.address, 'Object reference does not change');

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.satisfies(
      cachedResourceData?.attributes?.address as address,
      { street: '456 Elm Street', city: 'Sometown', state: 'NJ', zip: '23456' },
      'the cache values are correctly updated'
    );
  });

  test('we can update to null', async function (assert) {
    const store = new Store();
    const { schema } = store;
    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
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
            kind: 'schema-object',
            type: 'address',
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
    assert.satisfies(
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
    assert.equal(cachedResourceData?.attributes?.address, null, 'the cache values are correctly updated');
    record.address = {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    assert.satisfies(
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
    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
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
            kind: 'schema-object',
            type: 'address',
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
    assert.satisfies(
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
    assert.satisfies(
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
    assert.satisfies(
      cachedResourceData?.attributes?.address as address,
      { street: '123 Main Street', city: 'Anytown', state: 'NJ', zip: '12345' },
      'the cache values are correctly updated'
    );
  });

  test('we can assign an object value to another record', async function (assert) {
    const store = new Store();
    const { schema } = store;
    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
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
            kind: 'schema-object',
            type: 'address',
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
    assert.satisfies(
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
    assert.satisfies(
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
    assert.satisfies(
      cachedResourceData?.attributes?.address as address,
      {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'the cache values are correctly updated'
    );
  });

  test('throws errors when trying to set non-schema fields', async function (assert) {
    const store = new Store();
    const { schema } = store;
    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
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
            kind: 'schema-object',
            type: 'address',
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
    assert.satisfies(
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
        //@ts-expect-error
        record.address!.notAField = 'This should throw';
      },
      DEBUG
        ? /There is no settable field named notAField on address/
        : /'set' on proxy: trap returned falsish for property 'notAField'/
    );
    assert.throws(
      () => {
        record.address = {
          street: '456 Elm Street',
          city: 'Sometown',
          state: 'NJ',
          zip: '23456',
          //@ts-expect-error
          notAField: 'This should throw',
        };
      },
      DEBUG
        ? /Field notAField does not exist on schema object address/
        : /'set' on proxy: trap returned falsish for property 'address'/
    );
  });

  test('we can edit nested schema-object fields', async function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
    schema.registerResource({
      identity: null,
      type: 'business',
      fields: [
        {
          name: 'name',
          kind: 'field',
        },
        {
          name: 'address',
          type: 'address',
          kind: 'schema-object',
        },
      ],
    });
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
            type: 'address',
            kind: 'schema-object',
          },
          {
            name: 'business',
            type: 'business',
            kind: 'schema-object',
          },
        ],
      })
    );

    const sourceAddress: address = {
      street: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    const sourceBusinessAddress: address = {
      street: '456 Elm St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
          address: sourceAddress,
          business: { name: 'Acme', address: sourceBusinessAddress },
        },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);
    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.satisfies(
      record.address,
      { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' },
      'we can access address object'
    );
    assert.equal(record.address, record.address, 'We have a stable object reference');
    assert.notEqual(record.address, sourceAddress);
    assert.equal(record.business?.name, 'Acme');
    assert.satisfies(record.business?.address, { street: '456 Elm St', city: 'Anytown', state: 'NY', zip: '12345' });

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.satisfies(
      cachedResourceData?.attributes?.address as address,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'the cache values are correct for the object field'
    );
    assert.satisfies(
      cachedResourceData?.attributes?.business as business,
      {
        name: 'Acme',
        address: {
          street: '456 Elm St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
      },
      'the cache values are correct for a nested object field'
    );
    record.business!.address = { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' };
    assert.satisfies(
      record.business?.address,
      { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' },
      'we can access nested address object'
    );
    assert.equal(record.business?.address, record.business?.address, 'We have a stable object reference');
    // Test that the data entered teh cache properly
    const cachedResourceData2 = store.cache.peek(identifier);
    assert.satisfies(
      cachedResourceData2?.attributes?.business as business,
      {
        name: 'Acme',
        address: {
          street: '789 Oak St',
          city: 'Sometown',
          state: 'NJ',
          zip: '23456',
        },
      },
      'the cache values are correct for a nested object field'
    );
  });

  test('we can edit nested schema-array fields inside a schema-object', async function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'street',
          kind: 'field',
        },
        {
          name: 'city',
          kind: 'field',
        },
        {
          name: 'state',
          kind: 'field',
        },
        {
          name: 'zip',
          kind: 'field',
        },
      ],
    });
    schema.registerResource({
      identity: null,
      type: 'business',
      fields: [
        {
          name: 'name',
          kind: 'field',
        },
        {
          name: 'addresses',
          type: 'address',
          kind: 'schema-array',
        },
      ],
    });
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
            type: 'address',
            kind: 'schema-object',
          },
          {
            name: 'business',
            type: 'business',
            kind: 'schema-object',
          },
        ],
      })
    );
    const sourceAddress: address = {
      street: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    const sourceBusinessAddress1: address = {
      street: '456 Elm St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
    };
    const sourceBusinessAddress2: address = {
      street: '789 Oak St',
      city: 'Sometown',
      state: 'NJ',
      zip: '23456',
    };
    const immutableRecord = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
          address: sourceAddress,
          business: { name: 'Acme', addresses: [sourceBusinessAddress1, sourceBusinessAddress2] },
        },
      },
    });

    const record = await checkout<EditableUser>(immutableRecord);
    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.satisfies(
      record.address,
      { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' },
      'we can access address object'
    );
    assert.equal(record.address, record.address, 'We have a stable object reference');
    assert.equal(record.business?.name, 'Acme');
    assert.satisfies(record.business?.addresses, [
      { street: '456 Elm St', city: 'Anytown', state: 'NY', zip: '12345' },
      { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' },
    ]);
    assert.equal(record.business?.addresses, record.business?.addresses, 'We have a stable array reference');
    record.business!.addresses![0] = { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' };
    assert.satisfies(
      record.business?.addresses,
      [
        { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' },
        { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' },
      ],
      'we can access nested address object'
    );
    assert.equal(record.business?.addresses, record.business?.addresses, 'We have a stable array reference');
    // Test that the data entered teh cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);
    assert.satisfies(
      cachedResourceData?.attributes?.business as business,
      {
        name: 'Acme',
        addresses: [
          { street: '123 Main St', city: 'Anytown', state: 'NY', zip: '12345' },
          { street: '789 Oak St', city: 'Sometown', state: 'NJ', zip: '23456' },
        ],
      },
      'the cache values are correct for a nested object field'
    );
  });

  test('we can update a single value in the object with sourceKeys', async function (assert) {
    const store = new Store();
    const { schema } = store;
    schema.registerResource({
      identity: null,
      type: 'address',
      fields: [
        {
          name: 'zip',
          sourceKey: 'zip_code',
          kind: 'field',
        },
      ],
    });
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
            sourceKey: 'user_address',
            kind: 'schema-object',
            type: 'address',
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
          user_address: { zip_code: 90219 },
        },
      },
    });
    const record = await checkout<EditableUser>(immutableRecord);
    assert.satisfies(
      record.address as { zip: number },
      {
        zip: 90219,
      },
      'We have the correct address object'
    );
    const address = record.address;
    record.address!.zip = 90210;
    assert.satisfies(
      record.address as { zip: number },
      {
        zip: 90210,
      },
      'We have the correct address object'
    );
    assert.equal(address, record.address, 'Object reference does not change');
    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);
    assert.satisfies(
      cachedResourceData?.attributes?.user_address as { zip_code: number },
      { zip_code: 90210 },
      'the cache values are correctly updated'
    );
  });
});
