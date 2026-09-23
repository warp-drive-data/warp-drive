// #omit-file-from-starter
import { blur, click, currentURL, doubleClick, fillIn, triggerKeyEvent, visit } from '@ember/test-helpers';

import { module, test } from 'qunit';

import { setupApplicationTest } from 'ember-qunit';

import { resetTodos, submit, waitForTitles } from '../helpers/todos.ts';

async function addTodo(title: string): Promise<void> {
  await fillIn('.new-todo', title);
  await submit('.new-todo-form');
}

module('Acceptance | TodoMVC', function (hooks) {
  setupApplicationTest(hooks);

  module('with no todos', function (hooks) {
    hooks.beforeEach(async function () {
      await resetTodos();
    });

    test('main and footer are hidden', async function (assert) {
      await visit('/');
      assert.dom('.todoapp h1').hasText('todos');
      assert.dom('.todo-list li').doesNotExist();
      assert.dom('.toggle-all').doesNotExist();
      assert.dom('.footer').doesNotExist();
    });

    test('the new todo input is focused on load', async function (assert) {
      await visit('/');
      assert.dom('.new-todo').isFocused();
    });

    test('adds a todo, trims its title, and clears the input', async function (assert) {
      await visit('/');
      await addTodo('  Buy milk  ');
      await waitForTitles(['Buy milk']);
      assert.dom('.new-todo').hasValue('');
      assert.dom('.footer').exists();
    });

    test('does not add an empty todo', async function (assert) {
      await visit('/');
      await addTodo('   ');
      assert.dom('.todo-list li').doesNotExist();
    });

    test('new todos are appended to the bottom of the list', async function (assert) {
      await visit('/');
      await addTodo('one');
      await waitForTitles(['one']);
      await addTodo('two');
      await waitForTitles(['one', 'two']);
      assert.dom('.todo-list li').exists({ count: 2 });
    });
  });

  module('with todos', function (hooks) {
    hooks.beforeEach(async function () {
      await resetTodos([{ title: 'one' }, { title: 'two', completed: true }, { title: 'three' }]);
    });

    test('counts active todos', async function (assert) {
      await visit('/');
      await waitForTitles(['one', 'two', 'three']);
      assert.dom('.todo-count').hasText('2 items left');

      await click('.todo-list li:nth-child(1) .toggle');
      assert.dom('.todo-count').hasText('1 item left');

      await click('.todo-list li:nth-child(3) .toggle');
      assert.dom('.todo-count').hasText('0 items left');
    });

    test('toggles a todo complete and back', async function (assert) {
      await visit('/');
      await waitForTitles(['one', 'two', 'three']);

      await click('.todo-list li:nth-child(1) .toggle');
      assert.dom('.todo-list li:nth-child(1)').hasClass('completed');

      await click('.todo-list li:nth-child(1) .toggle');
      assert.dom('.todo-list li:nth-child(1)').doesNotHaveClass('completed');
    });

    test('mark all as complete, then all as active', async function (assert) {
      await visit('/');
      await waitForTitles(['one', 'two', 'three']);
      assert.dom('.toggle-all').isNotChecked();

      await click('.toggle-all');
      assert.dom('.todo-list li.completed').exists({ count: 3 });
      assert.dom('.toggle-all').isChecked();
      assert.dom('.todo-count').hasText('0 items left');

      await click('.toggle-all');
      assert.dom('.todo-list li.completed').doesNotExist();
      assert.dom('.todo-count').hasText('3 items left');
    });

    test('toggle-all reflects individual changes', async function (assert) {
      await visit('/');
      await waitForTitles(['one', 'two', 'three']);

      await click('.todo-list li:nth-child(1) .toggle');
      await click('.todo-list li:nth-child(3) .toggle');
      assert.dom('.toggle-all').isChecked();
    });

    test('deletes a todo', async function (assert) {
      await visit('/');
      await waitForTitles(['one', 'two', 'three']);

      await click('.todo-list li:nth-child(2) .destroy');
      await waitForTitles(['one', 'three']);
      assert.dom('.todo-count').hasText('2 items left');
    });

    module('editing', function () {
      test('double-clicking a label enters edit mode', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);

        await doubleClick('.todo-list li:nth-child(1) label');
        assert.dom('.todo-list li:nth-child(1)').hasClass('editing');
        assert.dom('.todo-list li:nth-child(1) .edit').isFocused();
        assert.dom('.todo-list li:nth-child(1) .edit').hasValue('one');
      });

      test('Enter saves a trimmed title', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);

        await doubleClick('.todo-list li:nth-child(1) label');
        await fillIn('.todo-list li:nth-child(1) .edit', '  uno  ');
        await submit('.todo-list li:nth-child(1) form');
        await waitForTitles(['uno', 'two', 'three']);
        assert.dom('.todo-list li:nth-child(1)').doesNotHaveClass('editing');
      });

      test('blur saves the title', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);

        await doubleClick('.todo-list li:nth-child(1) label');
        await fillIn('.todo-list li:nth-child(1) .edit', 'uno');
        await blur('.todo-list li:nth-child(1) .edit');
        await waitForTitles(['uno', 'two', 'three']);
        assert.dom('.todo-list li.editing').doesNotExist();
      });

      test('an empty title deletes the todo', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);

        await doubleClick('.todo-list li:nth-child(1) label');
        await fillIn('.todo-list li:nth-child(1) .edit', '   ');
        await submit('.todo-list li:nth-child(1) form');
        await waitForTitles(['two', 'three']);
        assert.dom('.todo-list li').exists({ count: 2 });
      });

      test('Escape cancels the edit', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);

        await doubleClick('.todo-list li:nth-child(1) label');
        await fillIn('.todo-list li:nth-child(1) .edit', 'changed');
        await triggerKeyEvent('.todo-list li:nth-child(1) .edit', 'keydown', 'Escape');
        assert.dom('.todo-list li.editing').doesNotExist();
        await waitForTitles(['one', 'two', 'three']);
      });

      test('other controls are hidden while editing', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);

        await doubleClick('.todo-list li:nth-child(1) label');
        assert.dom('.todo-list li:nth-child(1) .toggle').doesNotExist();
        assert.dom('.todo-list li:nth-child(1) .destroy').doesNotExist();
      });
    });

    module('clear completed', function () {
      test('removes completed todos', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);
        assert.dom('.clear-completed').exists();

        await click('.clear-completed');
        await waitForTitles(['one', 'three']);
        assert.dom('.clear-completed').doesNotExist();
      });
    });

    module('persistence', function () {
      test('todos survive a reload', async function (assert) {
        await visit('/');
        await waitForTitles(['one', 'two', 'three']);
        await click('.todo-list li:nth-child(1) .toggle');
        await addTodo('four');
        await waitForTitles(['one', 'two', 'three', 'four']);

        // Read back from the API worker's storage, which outlives the app.
        const response = await fetch('/api/todo');
        const doc = (await response.json()) as { data: { attributes: { title: string; completed: boolean } }[] };
        assert.deepEqual(
          doc.data.map((todo) => [todo.attributes.title, todo.attributes.completed]),
          [
            ['one', true],
            ['two', true],
            ['three', false],
            ['four', false],
          ]
        );
      });
    });

    module('routing', function () {
      test('filters by active and completed', async function (assert) {
        await visit('/active');
        await waitForTitles(['one', 'three']);
        assert.dom('.filters a.selected').hasText('Active');

        await visit('/completed');
        await waitForTitles(['two']);
        assert.dom('.filters a.selected').hasText('Completed');

        await visit('/');
        await waitForTitles(['one', 'two', 'three']);
        assert.dom('.filters a.selected').hasText('All');
      });

      test('the filter links navigate', async function (assert) {
        await visit('/');
        await click('.filters a[href="/completed"]');
        assert.strictEqual(currentURL(), '/completed');
        await waitForTitles(['two']);
      });

      test('completing a todo on the active view moves it to completed', async function (assert) {
        await visit('/active');
        await waitForTitles(['one', 'three']);

        await click('.todo-list li:nth-child(1) .toggle');
        await waitForTitles(['three']);

        await visit('/completed');
        await waitForTitles(['one', 'two']);
      });

      test('reactivating a todo on the completed view moves it to active', async function (assert) {
        await visit('/completed');
        await waitForTitles(['two']);

        await click('.todo-list li:nth-child(1) .toggle');
        await waitForTitles([]);

        await visit('/active');
        await waitForTitles(['two', 'one', 'three']);
      });

      test('toggle-all keeps the moved todos in order', async function (assert) {
        await visit('/completed');
        await waitForTitles(['two']);

        await visit('/active');
        await waitForTitles(['one', 'three']);
        await click('.toggle-all');

        await visit('/completed');
        await waitForTitles(['one', 'three', 'two']);
      });
    });
  });
});
