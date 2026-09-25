import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import { withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

import { reactiveContext } from '../-utils/reactive-context.gts';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  friends: ReactiveRelationshipDocument<User[]>;
  [Type]: 'user';
}

module('Reactivity | collection', function (hooks) {
  setupRenderingTest(hooks);

  test('a collection relationship document updates when the relationship receives a remote update', async function (assert) {
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
            name: 'friends',
            type: 'user',
            kind: 'collection',
            options: { inverse: 'friends', async: false },
          },
        ],
      })
    );
    const resource = schema.resource({ type: 'user' });

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Benedikt' },
          relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
        },
        {
          type: 'user',
          id: '3',
          attributes: { name: 'Jane' },
          relationships: { friends: { data: [] } },
        },
      ],
    });

    const doc = record.friends;
    const friends = doc.data!;
    assert.arrayEquals(
      friends.map((friend) => friend.id),
      ['2'],
      'friends are correct'
    );

    const { counters, fieldOrder } = await reactiveContext(record, resource);
    const friendsIndex = fieldOrder.indexOf('friends');

    assert.equal(counters.friends, 1, 'friendsCount is 1');
    assert.dom(`li:nth-child(${friendsIndex + 1})`).hasText('friends: 2', 'friends is rendered');

    // remote update
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            meta: { count: 2 },
            data: [
              { type: 'user', id: '2' },
              { type: 'user', id: '3' },
            ],
          },
        },
      },
    });

    assert.equal(record.friends, doc, 'the document instance is stable');
    assert.equal(doc.data, friends, 'the data array is stable');
    assert.arrayEquals(
      friends.map((friend) => friend.id),
      ['2', '3'],
      'friends are updated'
    );
    assert.deepEqual(doc.meta, { count: 2 }, 'meta is updated');

    await this.h.rerender();

    assert.equal(counters.friends, 2, 'friendsCount is 2');
    assert.dom(`li:nth-child(${friendsIndex + 1})`).hasText('friends: 2,3', 'friends is re-rendered');

    // remote update removing everything
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: { data: [] },
        },
      },
    });

    assert.equal(friends.length, 0, 'friends is empty');
    await this.h.rerender();
    assert.equal(counters.friends, 3, 'friendsCount is 3');
    assert.dom(`li:nth-child(${friendsIndex + 1})`).hasText('friends:', 'friends is re-rendered as empty');
  });
});
