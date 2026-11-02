import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import type {
  CollectionField,
  LinksModeBelongsToField,
  LinksModeHasManyField,
  ResourceField,
} from '@warp-drive/core/types/schema/fields';
import type {
  CollectionResourceRelationship,
  ExistingResourceIdentifierObject,
  SingleResourceRelationship,
} from '@warp-drive/core/types/spec/json-api-raw';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface Post {
  id: string | null;
  $type: 'post';
  [Type]: 'post';
}

interface User {
  id: string | null;
  $type: 'user';
  [Type]: 'user';
}

type NewKind = 'resource' | 'collection';
type LegacyKind = 'belongsTo' | 'hasMany';
type RelationshipKind = NewKind | LegacyKind;

const NEW_KINDS: NewKind[] = ['resource', 'collection'];
const LEGACY_KINDS: LegacyKind[] = ['belongsTo', 'hasMany'];

function isLegacy(kind: RelationshipKind): kind is LegacyKind {
  return kind === 'belongsTo' || kind === 'hasMany';
}

function isMany(kind: RelationshipKind): boolean {
  return kind === 'collection' || kind === 'hasMany';
}

function relationshipField(
  name: string,
  kind: RelationshipKind,
  type: string,
  inverse: string
): ResourceField | CollectionField | LinksModeBelongsToField | LinksModeHasManyField {
  switch (kind) {
    case 'resource':
      return { name, kind, type, options: { async: false, inverse } };
    case 'collection':
      return { name, kind, type, options: { async: false, inverse } };
    case 'belongsTo':
      return { name, kind, type, options: { async: false, inverse, linksMode: true } };
    case 'hasMany':
      return { name, kind, type, options: { async: false, inverse, linksMode: true } };
  }
}

/**
 * Registers `post.user` and `user.post` as each other's inverse,
 * with `post.user` of kind `postKind` and `user.post` of kind `userKind`.
 */
function setupStore(postKind: RelationshipKind, userKind: RelationshipKind) {
  const store = new Store();
  store.schema.registerResources([
    withDefaults({
      type: 'post',
      fields: [relationshipField('user', postKind, 'user', 'post')],
    }),
    withDefaults({
      type: 'user',
      fields: [relationshipField('post', userKind, 'post', 'user')],
    }),
  ]);
  return store;
}

function relationshipPayload(
  kind: RelationshipKind,
  related: ExistingResourceIdentifierObject,
  url: string
):
  | SingleResourceRelationship<ExistingResourceIdentifierObject>
  | CollectionResourceRelationship<ExistingResourceIdentifierObject> {
  if (isMany(kind)) {
    const relationship: CollectionResourceRelationship<ExistingResourceIdentifierObject> = { data: [related] };
    if (isLegacy(kind)) {
      relationship.links = { related: url };
    }
    return relationship;
  }
  const relationship: SingleResourceRelationship<ExistingResourceIdentifierObject> = { data: related };
  if (isLegacy(kind)) {
    relationship.links = { related: url };
  }
  return relationship;
}

function mismatchMessage(type: string, name: string, kind: RelationshipKind, inverse: string, inverseKind: string) {
  return `'${type}.${name}' is a '${kind}' field, but its inverse '${inverse}' is a '${inverseKind}' field. A 'resource' or 'collection' field can only have a 'resource' or 'collection' field as its inverse, and a 'belongsTo' or 'hasMany' field can only have a 'belongsTo' or 'hasMany' field as its inverse.`;
}

module('Graph | inverses of resource and collection fields', function (hooks) {
  setupTest(hooks);

  for (const newKind of NEW_KINDS) {
    for (const legacyKind of LEGACY_KINDS) {
      test(`a ${newKind} field cannot have a ${legacyKind} field as its inverse`, async function (assert) {
        const store = setupStore(newKind, legacyKind);

        await assert.expectAssertion(
          () =>
            store.push({
              data: {
                type: 'post',
                id: '1',
                relationships: { user: relationshipPayload(newKind, { type: 'user', id: '1' }, '/post/1/user') },
              },
            }),
          mismatchMessage('post', 'user', newKind, 'user.post', legacyKind)
        );
      });

      test(`a ${legacyKind} field cannot have a ${newKind} field as its inverse`, async function (assert) {
        const store = setupStore(newKind, legacyKind);

        await assert.expectAssertion(
          () =>
            store.push({
              data: {
                type: 'user',
                id: '1',
                relationships: { post: relationshipPayload(legacyKind, { type: 'post', id: '1' }, '/user/1/post') },
              },
            }),
          mismatchMessage('user', 'post', legacyKind, 'post.user', newKind)
        );
      });
    }
  }

  for (const postKind of NEW_KINDS) {
    for (const userKind of NEW_KINDS) {
      test(`a ${postKind} field can have a ${userKind} field as its inverse`, function (assert) {
        const store = setupStore(postKind, userKind);

        const post = store.push<Post>({
          data: {
            type: 'post',
            id: '1',
            relationships: { user: relationshipPayload(postKind, { type: 'user', id: '1' }, '/post/1/user') },
          },
          included: [{ type: 'user', id: '1' }],
        });
        const user = store.peekRecord<User>('user', '1')!;

        const postKey = recordIdentifierFor(post);
        const inverse = store.cache.getRemoteRelationship(recordIdentifierFor(user), 'post');
        assert.deepEqual(inverse.data, isMany(userKind) ? [postKey] : postKey, 'the inverse was updated');
      });
    }
  }
});
