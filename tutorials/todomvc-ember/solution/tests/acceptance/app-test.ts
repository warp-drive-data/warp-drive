import { visit } from '@ember/test-helpers';

import { module, test } from 'qunit';

import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | app', function (hooks) {
  setupApplicationTest(hooks);

  test('it renders the TodoMVC header', async function (assert) {
    await visit('/');
    assert.dom('.todoapp h1').hasText('todos');
  });
});
