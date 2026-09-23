import { visit } from '@ember/test-helpers';

import { module, test } from 'qunit';

import { setupApplicationTest } from 'ember-qunit';

// Holds for both solution/ and starter/, so it also checks that the starter boots.
module('Acceptance | app shell', function (hooks) {
  setupApplicationTest(hooks);

  test('renders the TodoMVC header and new todo input', async function (assert) {
    await visit('/');
    assert.dom('.todoapp h1').hasText('todos');
    assert.dom('.new-todo').exists();
  });
});
