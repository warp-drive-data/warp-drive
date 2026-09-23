import { module, test } from 'qunit';

import { SEED_TODOS, type TodoCollectionDocument, type TodoDocument } from '#api-worker/contract.ts';
import { memoryDb } from '#api-worker/db.ts';
import { createRouter, type Router } from '#api-worker/router.ts';

const JSON_API = 'application/vnd.api+json';

function request(method: string, path: string, body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': JSON_API },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

module('Unit | api-worker | router', function (hooks) {
  let router: Router;

  hooks.beforeEach(function () {
    router = createRouter(memoryDb());
  });

  test('GET /api/todo lists the seeded todos', async function (assert) {
    const response = await router(request('GET', '/api/todo'));
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('Content-Type'), JSON_API);
    const doc = (await response.json()) as TodoCollectionDocument;
    assert.deepEqual(doc.data, SEED_TODOS);
  });

  test('GET /api/todo filters by completed', async function (assert) {
    const completed = (await (
      await router(request('GET', '/api/todo?filter[completed]=true'))
    ).json()) as TodoCollectionDocument;
    assert.deepEqual(
      completed.data.map((todo) => todo.id),
      ['1']
    );

    const active = (await (
      await router(request('GET', '/api/todo?filter[completed]=false'))
    ).json()) as TodoCollectionDocument;
    assert.deepEqual(
      active.data.map((todo) => todo.id),
      ['2', '3']
    );

    const invalid = await router(request('GET', '/api/todo?filter[completed]=maybe'));
    assert.strictEqual(invalid.status, 400);
  });

  test('POST /api/todo creates a todo with a trimmed title', async function (assert) {
    const response = await router(
      request('POST', '/api/todo', { data: { type: 'todo', attributes: { title: '  Buy milk  ' } } })
    );
    assert.strictEqual(response.status, 201);
    const { data } = (await response.json()) as TodoDocument;
    assert.strictEqual(data.attributes.title, 'Buy milk');
    assert.false(data.attributes.completed);

    const list = (await (await router(request('GET', '/api/todo'))).json()) as TodoCollectionDocument;
    assert.strictEqual(list.data.length, SEED_TODOS.length + 1);
  });

  test('POST /api/todo rejects an empty title', async function (assert) {
    const response = await router(request('POST', '/api/todo', { data: { type: 'todo', attributes: { title: ' ' } } }));
    assert.strictEqual(response.status, 422);
    const doc = (await response.json()) as { errors: { source: { pointer: string } }[] };
    assert.strictEqual(doc.errors[0]?.source.pointer, '/data/attributes/title');
  });

  test('GET /api/todo/:id returns one todo or 404', async function (assert) {
    const found = await router(request('GET', '/api/todo/1'));
    assert.strictEqual(found.status, 200);
    assert.strictEqual(((await found.json()) as TodoDocument).data.id, '1');

    const missing = await router(request('GET', '/api/todo/nope'));
    assert.strictEqual(missing.status, 404);
  });

  test('PATCH /api/todo/:id updates attributes', async function (assert) {
    const response = await router(
      request('PATCH', '/api/todo/2', { data: { type: 'todo', id: '2', attributes: { completed: true } } })
    );
    assert.strictEqual(response.status, 200);
    const { data } = (await response.json()) as TodoDocument;
    assert.true(data.attributes.completed);
    assert.strictEqual(data.attributes.title, SEED_TODOS[1]?.attributes.title);
  });

  test('PATCH /api/todo/:id rejects a mismatched id', async function (assert) {
    const response = await router(
      request('PATCH', '/api/todo/2', { data: { type: 'todo', id: '3', attributes: { completed: true } } })
    );
    assert.strictEqual(response.status, 422);
  });

  test('DELETE /api/todo/:id removes the todo', async function (assert) {
    const response = await router(request('DELETE', '/api/todo/1'));
    assert.strictEqual(response.status, 204);
    assert.strictEqual((await router(request('GET', '/api/todo/1'))).status, 404);
  });

  test('PATCH ops.bulk.patch toggles several todos at once', async function (assert) {
    const response = await router(
      request('PATCH', '/api/todo/ops.bulk.patch', {
        data: [
          { type: 'todo', id: '2' },
          { type: 'todo', id: '3' },
        ],
        attributes: { completed: true },
      })
    );
    assert.strictEqual(response.status, 200);
    const doc = (await response.json()) as TodoCollectionDocument;
    assert.deepEqual(
      doc.data.map((todo) => todo.id),
      ['2', '3']
    );
    assert.true(doc.data.every((todo) => todo.attributes.completed));
  });

  test('DELETE ops.bulk.delete clears several todos at once', async function (assert) {
    const response = await router(
      request('DELETE', '/api/todo/ops.bulk.delete', { data: [{ type: 'todo', id: '1' }] })
    );
    assert.strictEqual(response.status, 204);
    const list = (await (await router(request('GET', '/api/todo'))).json()) as TodoCollectionDocument;
    assert.deepEqual(
      list.data.map((todo) => todo.id),
      ['2', '3']
    );
  });

  test('bulk operations reject unknown ids without changing anything', async function (assert) {
    const response = await router(
      request('DELETE', '/api/todo/ops.bulk.delete', {
        data: [
          { type: 'todo', id: '1' },
          { type: 'todo', id: 'nope' },
        ],
      })
    );
    assert.strictEqual(response.status, 404);
    const list = (await (await router(request('GET', '/api/todo'))).json()) as TodoCollectionDocument;
    assert.strictEqual(list.data.length, SEED_TODOS.length);
  });

  test('unknown routes return a JSON:API 404', async function (assert) {
    const response = await router(request('GET', '/api/nope'));
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.headers.get('Content-Type'), JSON_API);
  });
});
