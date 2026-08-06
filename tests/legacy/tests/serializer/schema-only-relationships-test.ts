/* eslint-disable warp-drive/no-legacy-request-patterns */
import { setOwner } from '@ember/owner';

import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { withDefaults } from '@warp-drive/legacy/model/migration-support';
import { JSONSerializer } from '@warp-drive/legacy/serializer/json';
import { EmbeddedRecordsMixin, RESTSerializer } from '@warp-drive/legacy/serializer/rest';

// https://github.com/warp-drive-data/warp-drive/issues/10454
//
// Serializers must be able to determine relationship cardinality and
// inverses using only the schema service, since resources defined via
// `withDefaults` (migration-support) are not backed by a `Model` class
// and so `store.modelFor(type)` cannot return anything with `Model`-only
// APIs like `determineRelationshipType` or `inverseFor`.
const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Serializer Contract | schema-only (migration-support) resources', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('adapter:application', JSONAPIAdapter);
  });

  test('shouldSerializeHasMany can determine relationship type without a Model class', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.owner.register('serializer:application', JSONSerializer);

    const { schema } = store;
    schema.registerResource(
      withDefaults({
        type: 'post',
        fields: [
          { name: 'title', kind: 'attribute' },
          { name: 'comments', kind: 'hasMany', type: 'comment', options: { async: false, inverse: 'post' } },
          { name: 'watchers', kind: 'hasMany', type: 'comment', options: { async: false, inverse: null } },
        ],
      })
    );
    schema.registerResource(
      withDefaults({
        type: 'comment',
        fields: [
          { name: 'message', kind: 'attribute' },
          { name: 'post', kind: 'belongsTo', type: 'post', options: { async: false, inverse: 'comments' } },
        ],
      })
    );

    const post = store.createRecord('post', { title: 'Rails is omakase' });
    const snapshot = (post as { _createSnapshot(): unknown })._createSnapshot();
    const serializer = store.serializerFor('post');

    const comments = schema.fields({ type: 'post' }).get('comments');
    const watchers = schema.fields({ type: 'post' }).get('watchers');

    assert.false(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      serializer.shouldSerializeHasMany(snapshot, 'comments', comments),
      'a hasMany relationship with an inverse belongsTo (manyToOne) is not serialized by default'
    );
    assert.true(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      serializer.shouldSerializeHasMany(snapshot, 'watchers', watchers),
      'a hasMany relationship with no inverse (manyToNone) is serialized by default'
    );
  });

  test('EmbeddedRecordsMixin can remove the embedded foreign key without a Model class', function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.owner.register('serializer:application', RESTSerializer);
    this.owner.register(
      'serializer:evil-minion',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      RESTSerializer.extend(EmbeddedRecordsMixin, {
        attrs: {
          secretWeapon: { embedded: 'always' },
        },
      })
    );

    const { schema } = store;
    schema.registerResource(
      withDefaults({
        type: 'secret-weapon',
        fields: [
          { name: 'name', kind: 'attribute' },
          { name: 'owner', kind: 'belongsTo', type: 'evil-minion', options: { async: false, inverse: 'secretWeapon' } },
        ],
      })
    );
    schema.registerResource(
      withDefaults({
        type: 'evil-minion',
        fields: [
          { name: 'name', kind: 'attribute' },
          {
            name: 'secretWeapon',
            kind: 'belongsTo',
            type: 'secret-weapon',
            options: { async: false, inverse: 'owner' },
          },
        ],
      })
    );

    const secretWeapon = store.createRecord('secret-weapon', { name: 'Secret Weapon' });
    const evilMinion = store.createRecord('evil-minion', { name: 'Evil Minion', secretWeapon });

    const serializer = store.serializerFor('evil-minion');
    const serializedRestJson = serializer.serialize((evilMinion as { _createSnapshot(): unknown })._createSnapshot());

    assert.deepEqual(
      serializedRestJson,
      {
        name: 'Evil Minion',
        secretWeapon: {
          name: 'Secret Weapon',
        },
      },
      'the embedded foreign key (owner) was correctly removed when serializing'
    );
  });
});
