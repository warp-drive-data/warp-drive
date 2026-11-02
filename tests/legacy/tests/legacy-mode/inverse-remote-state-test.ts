import { setOwner } from '@ember/owner';
import type { TestContext } from '@ember/test-helpers';

import { recordIdentifierFor } from '@warp-drive/core';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

interface Post {
  id: string | null;
  $type: 'post';
  title: string;
  [Type]: 'post';
}

interface Comment {
  id: string | null;
  $type: 'comment';
  body: string;
  [Type]: 'comment';
}

function setupStore(context: TestContext) {
  const store = new Store();
  setOwner(store, context.owner);
  store.schema.registerResources([
    withLegacy({
      type: 'post',
      fields: [
        { name: 'title', type: null, kind: 'attribute' },
        { name: 'comments', type: 'comment', kind: 'hasMany', options: { async: false, inverse: 'post' } },
      ],
    }),
    withLegacy({
      type: 'comment',
      fields: [
        { name: 'body', type: null, kind: 'attribute' },
        { name: 'post', type: 'post', kind: 'belongsTo', options: { async: false, inverse: 'comments' } },
      ],
    }),
  ]);
  return store;
}

function keyOf(record: Post | Comment): ResourceKey {
  return recordIdentifierFor(record);
}

// The comments are included without a `post` relationship, so everything the
// cache knows about `comment.post` comes from inverse updates in the graph.
function pushPost(store: InstanceType<typeof Store>, commentIds: string[]) {
  const post = store.push<Post>({
    data: {
      type: 'post',
      id: '1',
      attributes: { title: 'Relationships' },
      relationships: { comments: { data: commentIds.map((id) => ({ type: 'comment', id })) } },
    },
    included: [
      { type: 'comment', id: '1', attributes: { body: 'first' } },
      { type: 'comment', id: '2', attributes: { body: 'second' } },
    ],
  });
  const comment1 = store.peekRecord<Comment>('comment', '1')!;
  const comment2 = store.peekRecord<Comment>('comment', '2')!;
  return { post, comment1, comment2 };
}

/**
 * Records the relationship notifications delivered to subscribers of the
 * remote view of `key`, as `field` names.
 */
function recordRemoteNotifications(store: InstanceType<typeof Store>, key: ResourceKey): string[] {
  const fields: string[] = [];
  store.notifications.subscribe(
    key,
    (_key: ResourceKey, type: string, field?: string) => {
      if (type === 'relationships' && field) {
        fields.push(field);
      }
    },
    'remote'
  );
  return fields;
}

module('Legacy | Graph | remote state of inverses', function (hooks) {
  setupTest(hooks);

  test('a belongsTo filled in through its inverse has known-empty remote state after a remote removal', function (this: TestContext, assert) {
    const store = setupStore(this);
    const { post, comment1, comment2 } = pushPost(store, ['1', '2']);

    assert.equal(
      store.cache.getRemoteRelationship(keyOf(comment1), 'post').data,
      keyOf(post),
      'the remote state of the inverse is the post'
    );

    // a remote update to the hasMany that drops comment 1
    store.push<Post>({
      data: { type: 'post', id: '1', relationships: { comments: { data: [{ type: 'comment', id: '2' }] } } },
    });

    const remote = store.cache.getRemoteRelationship(keyOf(comment1), 'post');
    assert.true('data' in remote, 'the remote state of the inverse is known');
    assert.equal(remote.data, null, 'the remote state of the inverse is empty');
    assert.equal(
      store.cache.getRemoteRelationship(keyOf(comment2), 'post').data,
      keyOf(post),
      'the remaining member still points at the post'
    );
  });

  test('a remote update that confirms a local addition to a hasMany notifies its remote subscribers', function (this: TestContext, assert) {
    const store = setupStore(this);
    const { post, comment1, comment2 } = pushPost(store, ['1']);

    store.cache.mutate({
      op: 'replaceRelatedRecords',
      record: keyOf(post),
      field: 'comments',
      value: [keyOf(comment1), keyOf(comment2)],
    });
    assert.deepEqual(
      store.cache.getRemoteRelationship(keyOf(post), 'comments').data,
      [keyOf(comment1)],
      'the local addition is not in remote state yet'
    );

    const notified = recordRemoteNotifications(store, keyOf(post));

    // e.g. the response to saving comment 2: its belongsTo confirms the addition
    store.push<Comment>({
      data: { type: 'comment', id: '2', relationships: { post: { data: { type: 'post', id: '1' } } } },
    });

    assert.deepEqual(
      store.cache.getRemoteRelationship(keyOf(post), 'comments').data,
      [keyOf(comment1), keyOf(comment2)],
      'the remote state of the hasMany gained the member'
    );
    assert.deepEqual(notified, ['comments'], 'remote subscribers of the hasMany were notified');
  });

  test('a remote update that confirms a local removal from a hasMany notifies its remote subscribers', function (this: TestContext, assert) {
    const store = setupStore(this);
    const { post, comment1, comment2 } = pushPost(store, ['1', '2']);

    store.cache.mutate({
      op: 'replaceRelatedRecord',
      record: keyOf(comment1),
      field: 'post',
      value: null,
    });
    assert.deepEqual(
      store.cache.getRelationship(keyOf(post), 'comments').data,
      [keyOf(comment2)],
      'the local removal reached the hasMany'
    );
    assert.deepEqual(
      store.cache.getRemoteRelationship(keyOf(post), 'comments').data,
      [keyOf(comment1), keyOf(comment2)],
      'the local removal is not in remote state yet'
    );

    const notified = recordRemoteNotifications(store, keyOf(post));

    // e.g. the response to saving comment 1: its belongsTo confirms the removal
    store.push<Comment>({
      data: { type: 'comment', id: '1', relationships: { post: { data: null } } },
    });

    assert.deepEqual(
      store.cache.getRemoteRelationship(keyOf(post), 'comments').data,
      [keyOf(comment2)],
      'the remote state of the hasMany lost the member'
    );
    assert.deepEqual(notified, ['comments'], 'remote subscribers of the hasMany were notified');
  });
});
