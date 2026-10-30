import { module, setupTest, test } from '@warp-drive/diagnostic/ember';

import type { User } from './-utils/store';
import { createStore } from './-utils/store';

module('Store | unloadAll', function (hooks) {
  setupTest(hooks);

  test('peekAll(type) is empty after unloadAll() when type was never peeked before the unload', function (assert) {
    const store = createStore(this.owner);

    store.push<User>({
      data: [
        { type: 'user', id: '1', attributes: { name: 'Rey Skywalker' } },
        { type: 'user', id: '2', attributes: { name: 'Ben Solo' } },
      ],
    });

    store.unloadAll();

    // eslint-disable-next-line warp-drive/no-legacy-request-patterns
    const users = store.peekAll<User>('user');
    assert.equal(users.length, 0, 'unloaded records are not in peekAll');

    store.push<User>({
      data: { type: 'user', id: '3', attributes: { name: 'Finn' } },
    });

    assert.deepEqual(
      users.map((user) => user.name),
      ['Finn'],
      'records pushed after unloadAll appear in peekAll'
    );
  });
});
