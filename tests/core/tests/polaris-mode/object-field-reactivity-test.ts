import { rerender } from '@ember/test-helpers';

import { useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

import { reactiveContext } from '../-utils/reactive-context';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});
interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}
interface User {
  id: string | null;
  $type: 'user';
  name: string;
  favoriteNumbers: string[];
  address: Address;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
}

module('Reactivity | object fields can receive remote updates', function (hooks) {
  setupRenderingTest(hooks);

  test('we can use simple fields with no `type`', async function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'address',
            kind: 'object',
          },
        ],
      })
    );
    const resource = schema.resource({ type: 'user' });
    const record = store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: '12345',
          },
        },
      },
    }) as User;

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.deepEqual(
      record.address,
      {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '12345',
      },
      'address is accessible'
    );

    const { counters } = await reactiveContext(record, resource);
    // TODO: actually render the address object and verify
    // const addressIndex = fieldOrder.indexOf('address');

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.$type, 1, '$typeCount is 1');
    assert.equal(counters.address, 1, 'addressCount is 1');

    // remote update
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          address: {
            street: '456 Elm St',
            city: 'Anytown',
            state: 'NJ',
            zip: '23456',
          },
        },
      },
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.deepEqual(
      record.address,
      {
        street: '456 Elm St',
        city: 'Anytown',
        state: 'NJ',
        zip: '23456',
      },
      'address is accessible'
    );

    await rerender();

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.$type, 1, '$typeCount is 1');
    assert.equal(counters.address, 2, 'addressCount is 2');
  });
});
