import { setOwner } from '@ember/owner';

import { recordIdentifierFor } from '@warp-drive/core';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import Model, { hasMany } from '@warp-drive/legacy/model';
import { LEGACY_SUPPORT } from '@warp-drive/legacy/model/-private';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Legacy | Unload | legacy support', function (hooks) {
  setupTest(hooks);

  test('unloading a schema-backed legacy record releases its legacy support', function (assert) {
    type User = {
      id: string | null;
      name: string;
      friends: User[];
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });

    store.schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          { name: 'name', type: null, kind: 'attribute' },
          { name: 'friends', type: 'user', kind: 'hasMany', options: { async: false, inverse: 'friends' } },
        ],
      })
    );

    const user = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: { friends: { data: [] } },
      },
    });
    const identifier = recordIdentifierFor(user);

    assert.equal(user.friends.length, 0, 'the relationship is readable');
    assert.true(LEGACY_SUPPORT.has(identifier), 'accessing a relationship creates legacy support');

    store.unloadRecord(user);

    assert.false(LEGACY_SUPPORT.has(identifier), 'unloading the record releases its legacy support');
  });

  test('unloading a class-based legacy record releases its legacy support', function (assert) {
    class Tag extends Model {
      @hasMany('tag', { async: false, inverse: null })
      related;

      declare [Type]: 'tag';
    }
    this.owner.register('model:tag', Tag);
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });

    const tag = store.push<Tag>({
      data: {
        type: 'tag',
        id: '1',
        relationships: { related: { data: [] } },
      },
    });
    const identifier = recordIdentifierFor(tag);

    assert.equal(tag.related.length, 0, 'the relationship is readable');
    assert.true(LEGACY_SUPPORT.has(identifier), 'accessing a relationship creates legacy support');

    store.unloadRecord(tag);

    assert.false(LEGACY_SUPPORT.has(identifier), 'unloading the record releases its legacy support');
  });
});
