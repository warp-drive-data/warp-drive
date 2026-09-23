import { blur, click, currentURL, doubleClick, fillIn, findAll, triggerKeyEvent, visit } from '@ember/test-helpers';

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

    test('deleting an active todo updates the count', async function (assert) {
      await visit('/');
      await waitForTitles(['one', 'two', 'three']);

      await click('.todo-list li:nth-child(1) .destroy');
      await waitForTitles(['two', 'three']);
      assert.dom('.todo-count').hasText('1 item left');
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

        // The active list wasn't loaded yet, so it's fetched fresh, in server order.
        await visit('/active');
        await waitForTitles(['one', 'two', 'three']);
      });

      test('reactivating a todo refreshes an already-loaded active list', async function (assert) {
        await visit('/active');
        await waitForTitles(['one', 'three']);

        await visit('/completed');
        await waitForTitles(['two']);
        await click('.todo-list li:nth-child(1) .toggle');
        await waitForTitles([]);

        // patchCacheTodoActivated added it to the cached list and marked the list
        // stale, so showing it again refetches in the server's order.
        await visit('/active');
        await waitForTitles(['one', 'two', 'three']);
      });

      test('toggle-all refreshes an already-loaded list in server order', async function (assert) {
        await visit('/completed');
        await waitForTitles(['two']);

        await visit('/active');
        await waitForTitles(['one', 'three']);
        await click('.toggle-all');

        // Toggle-all marks every list stale, so the completed list refetches.
        await visit('/completed');
        await waitForTitles(['one', 'two', 'three']);
      });
    });
  });

  module('pagination', function (hooks) {
    const titles = Array.from({ length: 12 }, (_, i) => `todo ${i + 1}`);

    hooks.beforeEach(async function () {
      // Odd-numbered todos are completed.
      await resetTodos(titles.map((title, i) => ({ title, completed: i % 2 === 0 })));
    });

    test('shows 5 todos per page on the All view', async function (assert) {
      await visit('/');
      await waitForTitles(titles.slice(0, 5));
      assert.dom('.pagination-controls').exists();
      assert.dom('.pagination-button.prev').doesNotExist();
      assert.dom('.pagination-button.next').exists();
      assert.dom('.pagination-button-active').hasText('1');
    });

    test('next and previous move between pages and update the URL', async function (assert) {
      await visit('/');
      await waitForTitles(titles.slice(0, 5));

      await click('.pagination-button.next');
      await waitForTitles(titles.slice(5, 10));
      assert.strictEqual(currentURL(), '/?page=2');
      assert.dom('.pagination-button-active').hasText('2');

      await click('.pagination-button.prev');
      await waitForTitles(titles.slice(0, 5));
      assert.strictEqual(currentURL(), '/');
    });

    test('a page number jumps to that page', async function (assert) {
      await visit('/');
      await waitForTitles(titles.slice(0, 5));

      await click('.pagination-real-button:nth-of-type(3)');
      await waitForTitles(titles.slice(10));
      assert.strictEqual(currentURL(), '/?page=3');
      assert.dom('.pagination-button.next').doesNotExist();
    });

    test('loading a page URL directly shows that page', async function (assert) {
      await visit('/?page=3');
      await waitForTitles(titles.slice(10));
    });

    test('filtered views page 10 at a time and count across pages', async function (assert) {
      await visit('/active');
      await waitForTitles(titles.filter((_, i) => i % 2 === 1));
      assert.dom('.pagination-controls').doesNotExist();
      assert.dom('.todo-count').hasText('6 items left');
    });

    test('deleting a todo pulls the next one up from the following page', async function (assert) {
      await visit('/');
      const pageSize = findAll('.todo-list li').length;
      assert.ok(pageSize < titles.length, 'the list spans more than one page');

      await click('.todo-list li:nth-child(1) .destroy');
      await waitForTitles(titles.slice(1, pageSize + 1));
    });

    test('a page visited before a delete shows fresh todos when revisited', async function (assert) {
      await visit('/');
      await click('.pagination-button.next');
      await waitForTitles(titles.slice(5, 10));
      await click('.pagination-button.prev');
      await waitForTitles(titles.slice(0, 5));

      await click('.todo-list li:nth-child(1) .destroy');
      await waitForTitles(titles.slice(1, 6));

      await click('.pagination-button.next');
      await waitForTitles(titles.slice(6, 11));
    });

    test('mark all as complete reaches todos on other pages', async function (assert) {
      await visit('/');
      await waitForTitles(titles.slice(0, 5));

      await click('.toggle-all');
      assert.dom('.todo-count').hasText('0 items left');

      await click('.pagination-button.next');
      await waitForTitles(titles.slice(5, 10));
      assert.dom('.todo-list li.completed').exists({ count: 5 });
    });

    test('clear completed removes completed todos on every page', async function (assert) {
      await visit('/');
      await waitForTitles(titles.slice(0, 5));

      await click('.clear-completed');
      await waitForTitles(titles.filter((_, i) => i % 2 === 1).slice(0, 5));
      assert.dom('.todo-count').hasText('6 items left');
      assert.dom('.clear-completed').doesNotExist();
    });
  });
});
