import { find, settled, waitUntil } from '@ember/test-helpers';

import * as QUnit from 'qunit';

import { CACHE_NAME } from '#api-worker/db.ts';

const JSON_API = 'application/vnd.api+json';

/** Resets the API worker's storage to an empty list, or to the given titles. */
export async function resetTodos(todos: { title: string; completed?: boolean }[] = []): Promise<void> {
  await caches.delete(CACHE_NAME);

  await fetch('/api/todo/ops.bulk.deleteAll', { method: 'DELETE' });

  for (const { title, completed = false } of todos) {
    await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': JSON_API },
      body: JSON.stringify({ data: { type: 'todo', attributes: { title, completed } } }),
    });
  }
}

/** Submits a form the way pressing Enter would, including native validation. */
export async function submit(selector: string): Promise<void> {
  const form = find(selector);
  if (!(form instanceof HTMLFormElement)) throw new Error(`No form matches ${selector}`);
  form.requestSubmit();
  await settled();
}

/** Waits until the rendered todo list shows exactly these titles. */
export async function waitForTitles(titles: string[]): Promise<void> {
  const current = () => [...document.querySelectorAll('.todo-list li label')].map((el) => el.textContent?.trim());
  await waitUntil(() => JSON.stringify(current()) === JSON.stringify(titles), { timeout: 3000 }).catch(() => undefined);
  QUnit.config.current.assert.deepEqual(current(), titles, `todo list shows ${JSON.stringify(titles)}`);
}
