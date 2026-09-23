import { module, test } from 'qunit';

import {
  type CountDocument,
  SEED_TODOS,
  type TodoCollectionDocument,
  type TodoDocument,
  type TodoPageDocument,
  type TodoResource,
} from '#api-worker/contract.ts';
import { memoryDb } from '#api-worker/db.ts';
import { createRouter, type Router } from '#api-worker/router.ts';

const JSON_API = 'application/vnd.api+json';

function todos(count: number): TodoResource[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'todo',
    id: String(i + 1),
    attributes: { title: `todo ${i + 1}`, completed: i % 2 === 0 },
  }));
}

async function read<T>(response: Response | Promise<Response>): Promise<T> {
  return (await (await response).json()) as T;
}

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

  module('pagination', function (paginationHooks) {
    paginationHooks.beforeEach(function () {
      router = createRouter(memoryDb(todos(12)));
    });

    test('page[limit] and page[offset] return one page with links and meta', async function (assert) {
      const doc = await read<TodoPageDocument>(router(request('GET', '/api/todo?page[limit]=5&page[offset]=5')));
      assert.deepEqual(
        doc.data.map((todo) => todo.id),
        ['6', '7', '8', '9', '10']
      );
      assert.deepEqual(doc.meta, { currentPage: 2, totalPages: 3 });
      assert.deepEqual(doc.links, {
        self: '/api/todo?page[limit]=5&page[offset]=5',
        first: '/api/todo?page%5Blimit%5D=5&page%5Boffset%5D=0',
        last: '/api/todo?page%5Blimit%5D=5&page%5Boffset%5D=10',
        prev: '/api/todo?page%5Blimit%5D=5&page%5Boffset%5D=0',
        next: '/api/todo?page%5Blimit%5D=5&page%5Boffset%5D=10',
      });
    });

    test('the first and last pages omit prev and next', async function (assert) {
      const first = await read<TodoPageDocument>(router(request('GET', '/api/todo?page[limit]=5')));
      assert.strictEqual(first.links.prev, undefined);
      assert.strictEqual(typeof first.links.next, 'string');

      const last = await read<TodoPageDocument>(router(request('GET', '/api/todo?page[limit]=5&page[offset]=10')));
      assert.deepEqual(
        last.data.map((todo) => todo.id),
        ['11', '12']
      );
      assert.strictEqual(typeof last.links.prev, 'string');
      assert.strictEqual(last.links.next, undefined);
    });

    test('links keep the filter', async function (assert) {
      const doc = await read<TodoPageDocument>(
        router(request('GET', '/api/todo?filter[completed]=false&page[limit]=2'))
      );
      assert.deepEqual(
        doc.data.map((todo) => todo.id),
        ['2', '4']
      );
      assert.deepEqual(doc.meta, { currentPage: 1, totalPages: 3 });
      const next = new URL(doc.links.next ?? '', 'http://localhost');
      assert.strictEqual(next.searchParams.get('filter[completed]'), 'false');
      assert.strictEqual(next.searchParams.get('page[offset]'), '2');
    });

    test('following the next link walks every page', async function (assert) {
      const seen: string[] = [];
      let path: string | undefined = '/api/todo?page[limit]=5';
      while (path) {
        const doc: TodoPageDocument = await read<TodoPageDocument>(router(request('GET', path)));
        seen.push(...doc.data.map((todo) => todo.id));
        path = doc.links.next;
      }
      assert.deepEqual(
        seen,
        todos(12).map((todo) => todo.id)
      );
    });

    test('page[limit] defaults to 25 when only page[offset] is given', async function (assert) {
      const doc = await read<TodoPageDocument>(router(request('GET', '/api/todo?page[offset]=0')));
      assert.strictEqual(doc.data.length, 12);
      assert.deepEqual(doc.meta, { currentPage: 1, totalPages: 1 });
    });

    test('an empty list has one set of links, all at offset 0', async function (assert) {
      router = createRouter(memoryDb([]));
      const doc = await read<TodoPageDocument>(router(request('GET', '/api/todo?page[limit]=5')));
      assert.deepEqual(doc.data, []);
      assert.deepEqual(doc.meta, { currentPage: 1, totalPages: 0 });
      assert.strictEqual(doc.links.last, doc.links.first);
      assert.strictEqual(doc.links.prev, undefined);
      assert.strictEqual(doc.links.next, undefined);
    });

    test('invalid page parameters return a 400', async function (assert) {
      for (const query of [
        'page[limit]=0',
        'page[limit]=101',
        'page[limit]=2.5',
        'page[offset]=-1',
        'page[offset]=x',
      ]) {
        const response = await router(request('GET', `/api/todo?${query}`));
        assert.strictEqual(response.status, 400, query);
      }
    });
  });

  test('GET ops.count counts todos, optionally filtered', async function (assert) {
    const all = await read<CountDocument>(router(request('GET', '/api/todo/ops.count')));
    assert.deepEqual(all, { meta: { count: 3 } });

    const completed = await read<CountDocument>(router(request('GET', '/api/todo/ops.count?filter[completed]=true')));
    assert.deepEqual(completed, { meta: { count: 1 } });

    const active = await read<CountDocument>(router(request('GET', '/api/todo/ops.count?filter[completed]=false')));
    assert.deepEqual(active, { meta: { count: 2 } });
  });

  test('PATCH ops.bulk.patchAll updates every matching todo', async function (assert) {
    const response = await router(
      request('PATCH', '/api/todo/ops.bulk.patchAll?filter[completed]=false', { attributes: { completed: true } })
    );
    assert.strictEqual(response.status, 200);
    assert.deepEqual(await response.json(), { data: null });

    const list = await read<TodoCollectionDocument>(router(request('GET', '/api/todo')));
    assert.true(list.data.every((todo) => todo.attributes.completed));
  });

  test('PATCH ops.bulk.patchAll without a filter updates every todo', async function (assert) {
    await router(request('PATCH', '/api/todo/ops.bulk.patchAll', { attributes: { completed: false } }));
    const list = await read<TodoCollectionDocument>(router(request('GET', '/api/todo')));
    assert.true(list.data.every((todo) => !todo.attributes.completed));
  });

  test('PATCH ops.bulk.patchAll rejects invalid attributes', async function (assert) {
    const response = await router(
      request('PATCH', '/api/todo/ops.bulk.patchAll', { attributes: { completed: 'yes' } })
    );
    assert.strictEqual(response.status, 422);
    const list = await read<TodoCollectionDocument>(router(request('GET', '/api/todo')));
    assert.deepEqual(list.data, SEED_TODOS);
  });

  test('DELETE ops.bulk.deleteAll deletes every matching todo', async function (assert) {
    const response = await router(request('DELETE', '/api/todo/ops.bulk.deleteAll?filter[completed]=true'));
    assert.strictEqual(response.status, 200);
    assert.deepEqual(await response.json(), { data: null });
    const list = await read<TodoCollectionDocument>(router(request('GET', '/api/todo')));
    assert.deepEqual(
      list.data.map((todo) => todo.id),
      ['2', '3']
    );

    await router(request('DELETE', '/api/todo/ops.bulk.deleteAll'));
    const empty = await read<TodoCollectionDocument>(router(request('GET', '/api/todo')));
    assert.deepEqual(empty.data, []);
  });

  test('bulk operations reject an invalid filter without changing anything', async function (assert) {
    const response = await router(request('DELETE', '/api/todo/ops.bulk.deleteAll?filter[completed]=maybe'));
    assert.strictEqual(response.status, 400);
    const list = await read<TodoCollectionDocument>(router(request('GET', '/api/todo')));
    assert.strictEqual(list.data.length, SEED_TODOS.length);
  });

  test('unknown routes return a JSON:API 404', async function (assert) {
    const response = await router(request('GET', '/api/nope'));
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.headers.get('Content-Type'), JSON_API);
  });

  test('concurrent writes do not overwrite each other', async function (assert) {
    const complete = (id: string) =>
      router(request('PATCH', `/api/todo/${id}`, { data: { type: 'todo', id, attributes: { completed: true } } }));
    const create = (title: string) =>
      router(request('POST', '/api/todo', { data: { type: 'todo', attributes: { title } } }));

    await Promise.all([complete('2'), complete('3'), create('a'), create('b')]);

    const list = (await (await router(request('GET', '/api/todo'))).json()) as TodoCollectionDocument;
    assert.deepEqual(
      list.data.map((todo) => [todo.attributes.title, todo.attributes.completed]),
      [
        [SEED_TODOS[0].attributes.title, true],
        [SEED_TODOS[1].attributes.title, true],
        [SEED_TODOS[2].attributes.title, true],
        ['a', false],
        ['b', false],
      ]
    );
  });
});
