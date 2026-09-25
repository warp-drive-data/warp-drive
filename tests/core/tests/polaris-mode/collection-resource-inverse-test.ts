import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface Post {
  id: string | null;
  $type: 'post';
  title: string;
  comments: ReactiveRelationshipDocument<Comment[]>;
  [Type]: 'post';
}

interface Comment {
  id: string | null;
  $type: 'comment';
  body: string;
  post: ReactiveRelationshipDocument<Post | null>;
  [Type]: 'comment';
}

function registerSchemas(store: InstanceType<typeof Store>) {
  store.schema.registerResources([
    withDefaults({
      type: 'post',
      fields: [
        { name: 'title', kind: 'field' },
        { name: 'comments', kind: 'collection', type: 'comment', options: { inverse: 'post', async: false } },
      ],
    }),
    withDefaults({
      type: 'comment',
      fields: [
        { name: 'body', kind: 'field' },
        { name: 'post', kind: 'resource', type: 'post', options: { inverse: 'comments', async: false } },
      ],
    }),
  ]);
}

// the comments are included without a `post` relationship so that their side
// of the relationship comes entirely from the inverse update in the graph
function pushPost(store: InstanceType<typeof Store>) {
  const post = store.push<Post>({
    data: {
      type: 'post',
      id: '1',
      attributes: { title: 'Relationships' },
      relationships: {
        comments: {
          data: [
            { type: 'comment', id: '1' },
            { type: 'comment', id: '2' },
          ],
        },
      },
    },
    included: [
      { type: 'comment', id: '1', attributes: { body: 'first' } },
      { type: 'comment', id: '2', attributes: { body: 'second' } },
    ],
  });
  const comment3 = store.push<Comment>({
    data: { type: 'comment', id: '3', attributes: { body: 'third' }, relationships: { post: { data: null } } },
  });
  const comment1 = store.peekRecord<Comment>('comment', '1')!;
  const comment2 = store.peekRecord<Comment>('comment', '2')!;
  return { post, comment1, comment2, comment3 };
}

function ids(doc: ReactiveRelationshipDocument<Comment[]>): string[] {
  return doc.data!.map((comment) => comment.id!);
}

module('Inverses | collection <-> resource', function (hooks) {
  setupTest(hooks);

  test('a payload for either side populates the other', function (assert) {
    const store = new Store();
    registerSchemas(store);
    const { post, comment1, comment2, comment3 } = pushPost(store);

    assert.arrayEquals(ids(post.comments), ['1', '2'], 'the post has its comments');
    assert.equal(comment1.post.data, post, 'comment 1 points at the post via the inverse');
    assert.equal(comment2.post.data, post, 'comment 2 points at the post via the inverse');
    assert.equal(comment3.post.data, null, 'comment 3 has no post');

    // only the resource side is in this payload
    store.push<Comment>({
      data: { type: 'comment', id: '3', relationships: { post: { data: { type: 'post', id: '1' } } } },
    });

    assert.equal(comment3.post.data, post, 'comment 3 points at the post');
    assert.arrayEquals(ids(post.comments), ['1', '2', '3'], 'the post gained the comment via the inverse');
  });

  test('editing the collection side updates the resource side of checked out records', async function (assert) {
    const store = new Store();
    registerSchemas(store);
    const { post, comment1, comment3 } = pushPost(store);
    const editablePost = await checkout<Post>(post);
    const editableComment1 = await checkout<Comment>(comment1);
    const editableComment3 = await checkout<Comment>(comment3);

    editablePost.comments.data!.push(comment3);

    assert.arrayEquals(ids(editablePost.comments), ['1', '2', '3'], 'push adds the comment locally');
    assert.equal(editableComment3.post.data, post, 'the local inverse was updated');
    assert.equal(comment3.post.data, null, 'the immutable inverse still reflects the remote state');
    assert.arrayEquals(ids(post.comments), ['1', '2'], 'the immutable document still reflects the remote state');

    editablePost.comments.data!.splice(0, 1);

    assert.arrayEquals(ids(editablePost.comments), ['2', '3'], 'splice removes the comment locally');
    assert.equal(editableComment1.post.data, null, 'the local inverse was cleared');
    assert.equal(comment1.post.data, post, 'the immutable inverse still reflects the remote state');
    assert.arrayEquals(ids(post.comments), ['1', '2'], 'the immutable document still reflects the remote state');
  });

  test('editing the resource side updates the collection side of checked out records', async function (assert) {
    const store = new Store();
    registerSchemas(store);
    const { post, comment2, comment3 } = pushPost(store);
    const editablePost = await checkout<Post>(post);
    const editableComment2 = await checkout<Comment>(comment2);
    const editableComment3 = await checkout<Comment>(comment3);

    editableComment2.post.data = null;

    assert.equal(editableComment2.post.data, null, 'the comment no longer points at the post locally');
    assert.arrayEquals(ids(editablePost.comments), ['1'], 'the local inverse was updated');
    assert.arrayEquals(ids(post.comments), ['1', '2'], 'the immutable inverse still reflects the remote state');
    assert.equal(comment2.post.data, post, 'the immutable document still reflects the remote state');

    editableComment3.post.data = post;

    assert.equal(editableComment3.post.data, post, 'the comment points at the post locally');
    assert.arrayEquals(ids(editablePost.comments), ['1', '3'], 'the local inverse was updated');
    assert.arrayEquals(ids(post.comments), ['1', '2'], 'the immutable inverse still reflects the remote state');
    assert.equal(comment3.post.data, null, 'the immutable document still reflects the remote state');
  });

  test('a payload confirming a local change updates the immutable records on both sides', async function (assert) {
    const store = new Store();
    registerSchemas(store);
    const { post, comment1, comment3 } = pushPost(store);
    const editablePost = await checkout<Post>(post);

    editablePost.comments.data!.push(comment3);
    editablePost.comments.data!.splice(0, 1);
    assert.arrayEquals(ids(post.comments), ['1', '2'], 'the immutable document still reflects the remote state');
    assert.equal(comment1.post.data, post, 'the immutable inverse still reflects the remote state');
    assert.equal(comment3.post.data, null, 'the immutable inverse still reflects the remote state');

    // e.g. the response to a save request
    store.push<Post>({
      data: {
        type: 'post',
        id: '1',
        relationships: {
          comments: {
            data: [
              { type: 'comment', id: '2' },
              { type: 'comment', id: '3' },
            ],
          },
        },
      },
    });

    assert.arrayEquals(ids(post.comments), ['2', '3'], 'the immutable document reflects the confirmed state');
    assert.arrayEquals(ids(editablePost.comments), ['2', '3'], 'the editable document reflects the confirmed state');
    assert.false(editablePost.comments.isDirty, 'the relationship is no longer dirty');
    assert.equal(comment3.post.data, post, 'the immutable inverse reflects the confirmed state');
    assert.equal(comment1.post.data, null, 'the immutable prior inverse reflects the confirmed state');
  });
});
