import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import { withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});
interface address {
  street: string;
  city: string;
  state: string;
  zip: string | number;
}

interface CreateUserType {
  id: string | null;
  $type: 'user';
  name: string | null;
  addresses: Array<address | null> | null;
  [Type]: 'user';
}

type User = Readonly<{
  id: string | null;
  $type: 'user';
  name: string | null;
  addresses: Array<address | null> | null;
  [Type]: 'user';
}>;

module('Writes | schema-array fields', function (hooks) {
  setupTest(hooks);

  module('Immutability', function () {
    test('we cannot update to a new array', function (assert) {
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
              name: 'addresses',
              type: 'address',
              kind: 'schema-array',
            },
          ],
        })
      );

      const sourceArray = [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ];

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            addresses: sourceArray,
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
      assert.throws(
        () => {
          // @ts-expect-error we're testing the immutability of the array
          record.addresses = [
            {
              street: '789 Maple St',
              city: 'Thistown',
              state: 'TX',
              zip: '67890',
            },
            {
              street: '012 Oak St',
              city: 'ThatTown',
              state: 'FL',
              zip: '09876',
            },
          ];
        },
        DEBUG
          ? /Error: Cannot set addresses on user because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'addresses'/
      );

      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
    });

    test('we cannot update individual objects in the array to new objects', function (assert) {
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
              name: 'addresses',
              type: 'address',
              kind: 'schema-array',
            },
          ],
        })
      );

      const sourceArray = [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ];

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            addresses: sourceArray,
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
      assert.throws(
        () => {
          record.addresses![0] = {
            street: '789 Maple St',
            city: 'Thistown',
            state: 'TX',
            zip: '67890',
          };
        },
        DEBUG
          ? /Error: Cannot set 0 on addresses because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property '0'/
      );

      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
    });

    test('we cannot update individual objects in the array to null', function (assert) {
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
              name: 'addresses',
              type: 'address',
              kind: 'schema-array',
            },
          ],
        })
      );

      const sourceArray = [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ];

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            addresses: sourceArray,
          },
        },
      });
      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
      assert.throws(
        () => {
          record.addresses![0] = null;
        },
        DEBUG
          ? /Error: Cannot set 0 on addresses because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property '0'/
      );

      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
    });

    test('we cannot update individual fields in objects in the array to new values', function (assert) {
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
              name: 'addresses',
              type: 'address',
              kind: 'schema-array',
            },
          ],
        })
      );

      const sourceArray = [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ];

      const record = store.push<User>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            addresses: sourceArray,
          },
        },
      });

      assert.equal(record.id, '1', 'id is accessible');
      assert.equal(record.$type, 'user', '$type is accessible');
      assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
      assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
      assert.throws(
        () => {
          record.addresses![0]!.street = '789 Maple St';
        },
        DEBUG
          ? /Error: Cannot set street on address because the ReactiveResource is not editable/
          : /'set' on proxy: trap returned falsish for property 'street'/
      );

      assert.satisfies(
        record.addresses?.slice(),
        [
          {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
          {
            street: '456 Elm St',
            city: 'Othertown',
            state: 'CA',
            zip: '54321',
          },
        ],
        'We have the correct array members'
      );
    });
  });
  test('we can update to a new array', function (assert) {
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
            name: 'addresses',
            type: 'address',
            kind: 'schema-array',
          },
        ],
      })
    );

    const sourceArray = [
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      {
        street: '456 Elm St',
        city: 'Othertown',
        state: 'CA',
        zip: '54321',
      },
    ];
    const record = store.createRecord<CreateUserType>('user', {
      name: 'Rey Skybarker',
      addresses: sourceArray,
    });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
    assert.satisfies(
      record.addresses?.slice(),
      [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'We have the correct array members'
    );
    record.addresses = [
      {
        street: '789 Maple St',
        city: 'Thistown',
        state: 'TX',
        zip: '67890',
      },
      {
        street: '012 Oak St',
        city: 'ThatTown',
        state: 'FL',
        zip: '09876',
      },
    ];
    assert.satisfies(
      record.addresses?.slice(),
      [
        {
          street: '789 Maple St',
          city: 'Thistown',
          state: 'TX',
          zip: '67890',
        },
        {
          street: '012 Oak St',
          city: 'ThatTown',
          state: 'FL',
          zip: '09876',
        },
      ],
      'We have the correct array members'
    );
    assert.equal(record.addresses, record.addresses, 'We have a stable array reference');
    assert.notEqual(record.addresses, sourceArray);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.notEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      sourceArray,
      'with no transform we will still divorce the array reference'
    );
    assert.satisfies(
      cachedResourceData?.attributes?.addresses as Array<address | null>,
      [
        {
          street: '789 Maple St',
          city: 'Thistown',
          state: 'TX',
          zip: '67890',
        },
        {
          street: '012 Oak St',
          city: 'ThatTown',
          state: 'FL',
          zip: '09876',
        },
      ],
      'the cache values are correct for the array field'
    );
  });

  test('we can update individual objects in the array to new objects', function (assert) {
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
            name: 'addresses',
            type: 'address',
            kind: 'schema-array',
          },
        ],
      })
    );

    const sourceArray = [
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      {
        street: '456 Elm St',
        city: 'Othertown',
        state: 'CA',
        zip: '54321',
      },
    ];
    const record = store.createRecord<CreateUserType>('user', {
      name: 'Rey Skybarker',
      addresses: sourceArray,
    });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
    assert.satisfies(
      record.addresses?.slice(),
      [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'We have the correct array members'
    );
    record.addresses![0] = {
      street: '789 Maple St',
      city: 'Thistown',
      state: 'TX',
      zip: '67890',
    };
    assert.satisfies(
      record.addresses?.slice(),
      [
        {
          street: '789 Maple St',
          city: 'Thistown',
          state: 'TX',
          zip: '67890',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'We have the correct array members'
    );
    assert.equal(record.addresses, record.addresses, 'We have a stable array reference');
    assert.notEqual(record.addresses, sourceArray);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.notEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      sourceArray,
      'with no transform we will still divorce the array reference'
    );
    assert.satisfies(
      cachedResourceData?.attributes?.addresses as Array<address | null>,
      [
        {
          street: '789 Maple St',
          city: 'Thistown',
          state: 'TX',
          zip: '67890',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'the cache values are correct for the array field'
    );
  });

  test('we can update individual fields in objects in the array to new values', function (assert) {
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
            name: 'addresses',
            type: 'address',
            kind: 'schema-array',
          },
        ],
      })
    );

    const sourceArray = [
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      {
        street: '456 Elm St',
        city: 'Othertown',
        state: 'CA',
        zip: '54321',
      },
    ];
    const record = store.createRecord<CreateUserType>('user', {
      name: 'Rey Skybarker',
      addresses: sourceArray,
    });

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Array.isArray(record.addresses), 'we can access favoriteNumber array');
    assert.satisfies(
      record.addresses?.slice(),
      [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'We have the correct array members'
    );
    record.addresses![0]!.street = '789 Maple St';

    assert.satisfies(
      record.addresses?.slice(),
      [
        {
          street: '789 Maple St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'We have the correct array members'
    );
    assert.equal(record.addresses, record.addresses, 'We have a stable array reference');
    assert.notEqual(record.addresses, sourceArray);

    // test that the data entered the cache properly
    const identifier = recordIdentifierFor(record);
    const cachedResourceData = store.cache.peek(identifier);

    assert.notEqual(
      cachedResourceData?.attributes?.favoriteNumbers,
      sourceArray,
      'with no transform we will still divorce the array reference'
    );
    assert.satisfies(
      cachedResourceData?.attributes?.addresses as Array<address | null>,
      [
        {
          street: '789 Maple St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        {
          street: '456 Elm St',
          city: 'Othertown',
          state: 'CA',
          zip: '54321',
        },
      ],
      'the cache values are correct for the array field'
    );
  });
});
