import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import Model, { attr, belongsTo, hasMany } from '@warp-drive/legacy/model';

import Store from '../serializer/store';

class User extends Model {
  @attr
  name;

  @attr('date', { sourceKey: 'created-at' })
  createdAt;

  @belongsTo('user', { async: false, inverse: null, sourceKey: 'best-friend' })
  bestFriend;

  @hasMany('user', { async: false, inverse: null, sourceKey: 'best-friends' })
  friends;

  declare [Type]: 'user';
}

module('Unit | Model | sourceKey', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', Store);
    this.owner.register('model:user', User);
  });

  test('an attribute with a sourceKey reads from the source key in the payload', function (assert) {
    const store = this.owner.lookup('service:store') as Store;

    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
          'created-at': '2026-02-15T20:27:03.665Z',
        },
      },
    });

    const rey = store.peekRecord<User>('user', '1')!;

    assert.equal(rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(
      (rey.createdAt as unknown as Date).toISOString(),
      '2026-02-15T20:27:03.665Z',
      'createdAt is populated from the "created-at" key'
    );
  });

  test('setting an attribute with a sourceKey round-trips through the source key', function (assert) {
    const store = this.owner.lookup('service:store') as Store;

    const rey = store.createRecord<User>('user', { name: 'Rey Skybarker' });
    const date = new Date('2026-02-15T20:27:03.665Z');
    rey.createdAt = date as unknown as string;

    assert.equal(rey.createdAt, date, 'createdAt reflects the just-set value');
  });

  test('a belongsTo with a sourceKey reads from the source key in the payload', function (assert) {
    const store = this.owner.lookup('service:store') as Store;

    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
        relationships: {
          'best-friend': { data: { type: 'user', id: '2' } },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Matt Seidel' },
        },
      ],
    });

    const rey = store.peekRecord<User>('user', '1')!;
    const matt = store.peekRecord<User>('user', '2')!;

    assert.equal(rey.bestFriend, matt, 'bestFriend is populated from the "best-friend" relationship key');
  });

  test('a hasMany with a sourceKey reads from the source key in the payload', function (assert) {
    const store = this.owner.lookup('service:store') as Store;

    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
        relationships: {
          'best-friends': { data: [{ type: 'user', id: '2' }] },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Matt Seidel' },
        },
      ],
    });

    const rey = store.peekRecord<User>('user', '1')!;
    const matt = store.peekRecord<User>('user', '2')!;

    assert.equal(rey.friends.length, 1, 'friends is populated from the "best-friends" relationship key');
    assert.equal(rey.friends.at(0), matt, 'friends contains the expected record');
  });
});
