import { module, test } from 'qunit';

import type { TodoCollectionDocument, TodoDocument } from '#api-worker/contract.ts';

const JSON_API = 'application/vnd.api+json';

// These run after test-helper has awaited startApiWorker(), in a fresh browser
// profile in CI, so they also cover the first-visit boot path.
module('Integration | api-worker', function () {
  test('the worker controls the page', function (assert) {
    assert.ok(navigator.serviceWorker.controller, 'page is controlled');
  });

  test('fetch to /api is answered by the worker', async function (assert) {
    const response = await fetch('/api/todo', { headers: { Accept: JSON_API } });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('Content-Type'), JSON_API);
    const doc = (await response.json()) as TodoCollectionDocument;
    assert.true(Array.isArray(doc.data));
  });

  test('writes persist across requests', async function (assert) {
    const title = `persisted ${crypto.randomUUID()}`;
    const created = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': JSON_API },
      body: JSON.stringify({ data: { type: 'todo', attributes: { title } } }),
    });
    assert.strictEqual(created.status, 201);
    const { data } = (await created.json()) as TodoDocument;

    const fetched = await fetch(`/api/todo/${data.id}`);
    assert.strictEqual(((await fetched.json()) as TodoDocument).data.attributes.title, title);

    const deleted = await fetch(`/api/todo/${data.id}`, { method: 'DELETE' });
    assert.strictEqual(deleted.status, 204);
  });
});
