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
  bestFriend: ReactiveRelationshipDocument<User | null>;
  [Type]: 'user';
}

module('Reactivity | resource', function (hooks) {
  setupRenderingTest(hooks);

  test('a resource relationship document updates when the relationship receives a remote update', async function (assert) {
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
            name: 'bestFriend',
            type: 'user',
            kind: 'resource',
            options: { inverse: 'bestFriend', async: false },
          },
        ],
      })
    );
    const resource = schema.resource({ type: 'user' });

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            meta: { version: 1 },
            data: { type: 'user', id: '2' },
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Rey' },
          relationships: { bestFriend: { data: { type: 'user', id: '1' } } },
        },
        {
          type: 'user',
          id: '3',
          attributes: { name: 'Ray' },
          relationships: { bestFriend: { data: null } },
        },
      ],
    });

    const doc = record.bestFriend;
    assert.equal(doc.data?.id, '2', 'bestFriend.data.id is accessible');

    const { counters, fieldOrder } = await reactiveContext(record, resource);
    const bestFriendIndex = fieldOrder.indexOf('bestFriend');

    assert.equal(counters.bestFriend, 1, 'bestFriendCount is 1');
    assert.dom(`li:nth-child(${bestFriendIndex + 1})`).hasText('bestFriend: 2', 'bestFriend is rendered');

    // remote update
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend?v=2' },
            meta: { version: 2 },
            data: { type: 'user', id: '3' },
          },
        },
      },
    });

    assert.equal(record.bestFriend, doc, 'the document instance is stable');
    assert.equal(doc.data?.id, '3', 'bestFriend.data.id is updated');
    assert.deepEqual(doc.links, { related: '/user/1/bestFriend?v=2' }, 'links are updated');
    assert.deepEqual(doc.meta, { version: 2 }, 'meta is updated');

    await this.h.rerender();

    assert.equal(counters.bestFriend, 2, 'bestFriendCount is 2');
    assert.dom(`li:nth-child(${bestFriendIndex + 1})`).hasText('bestFriend: 3', 'bestFriend is re-rendered');

    // remote update to null
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: { data: null },
        },
      },
    });

    assert.equal(doc.data, null, 'bestFriend.data is null');
    await this.h.rerender();
    assert.equal(counters.bestFriend, 3, 'bestFriendCount is 3');
    assert.dom(`li:nth-child(${bestFriendIndex + 1})`).hasText('bestFriend:', 'bestFriend is re-rendered as empty');
  });
});
