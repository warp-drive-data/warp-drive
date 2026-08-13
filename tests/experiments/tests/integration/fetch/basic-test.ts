import { RequestManager } from '@warp-drive/core';
import { module, test } from '@warp-drive/diagnostic';
import type { Parser } from '@warp-drive/experiments/fetch';
import { Fetch, withChunkHandler } from '@warp-drive/experiments/fetch';

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function streamOf(chunks: string[], contentType = 'application/x-ndjson'): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': contentType } });
}

module('Integration | Fetch (experimental)', function (hooks) {
  const originalFetch = globalThis.fetch;

  hooks.beforeEach(function () {
    // force the real (non-Mirage) code path: our stubbed `globalThis.fetch`
    // below would otherwise trip the Mirage heuristic, since it doesn't
    // match the native `fetch` function's toString().
    // @ts-expect-error not present in the global type, set by @warp-drive/core
    globalThis.setWarpDriveIsMaybeMirage(false);
  });

  hooks.afterEach(function () {
    globalThis.fetch = originalFetch;
    // @ts-expect-error not present in the global type, set by @warp-drive/core
    delete globalThis.getWarpDriveRuntimeConfig().mirage;
  });

  test('parses 200 JSON responses', async function (assert) {
    globalThis.fetch = () =>
      Promise.resolve(jsonResponse({ data: { id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } } }));

    const manager = new RequestManager();
    manager.use([Fetch]);

    const doc = await manager.request({ url: 'https://example.com/users/1' });
    assert.deepEqual(
      doc.content,
      { data: { id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } } },
      'the response is parsed correctly'
    );
  });

  test('supports HEAD requests', async function (assert) {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 204 }));

    const manager = new RequestManager();
    manager.use([Fetch]);

    const doc = await manager.request({ url: 'https://example.com/users/1', method: 'HEAD' });
    assert.equal(doc.content, null, 'HEAD requests resolve with null content');
  });

  test('provides useful errors for non-ok responses', async function (assert) {
    globalThis.fetch = () =>
      Promise.resolve(
        jsonResponse(
          { errors: [{ status: '404', title: 'Not Found', detail: 'The resource does not exist.' }] },
          { status: 404, statusText: 'Not Found' }
        )
      );

    const manager = new RequestManager();
    manager.use([Fetch]);

    try {
      await manager.request({ url: 'https://example.com/users/1' });
      assert.ok(false, 'Should have thrown');
    } catch (e) {
      assert.true(e instanceof AggregateError, 'the error is an AggregateError');
      assert.equal((e as Error & { status: number }).status, 404, 'the error status is correct');
      assert.equal((e as Error).name, 'NotFoundError', 'the error name is correct');
    }
  });

  test('respects a configured parserType', async function (assert) {
    globalThis.fetch = () => Promise.resolve(new Response('<p>hi</p>', { headers: { 'content-type': 'text/plain' } }));

    const manager = new RequestManager();
    manager.use([new Fetch({ parserType: () => 'html' })]);

    const doc = await manager.request<Document>({ url: 'https://example.com/page' });
    assert.true(doc.content instanceof Document, 'the html parser was used instead of the content-type default');
  });

  test('calls onChunk once per NDJSON line, in order, as the response streams in', async function (assert) {
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\n{"a"', ':2}\n{"a":3}\n']));

    const manager = new RequestManager();
    manager.use([Fetch]);

    const received: unknown[] = [];
    const doc = await manager.request<{ a: number }[]>({
      url: 'https://example.com/stream',
      options: {
        onChunk: withChunkHandler<{ a: number }>((chunk) => {
          received.push(chunk);
        }),
      },
    });

    assert.deepEqual(received, [{ a: 1 }, { a: 2 }, { a: 3 }], 'onChunk fired once per line, in order');
    assert.deepEqual(
      doc.content,
      [{ a: 1 }, { a: 2 }, { a: 3 }],
      'the final resolved content is the full parsed array'
    );
  });

  test('correctly reassembles frames split across multiple network reads', async function (assert) {
    // each array entry becomes its own `controller.enqueue` call, guaranteeing
    // multiple separate `reader.read()` resolutions rather than one
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\n', '{"a":2}\n', '{"a":3}\n']));

    const manager = new RequestManager();
    manager.use([Fetch]);

    const received: unknown[] = [];
    await manager.request({
      url: 'https://example.com/stream',
      options: { onChunk: (chunk: unknown) => received.push(chunk) },
    });

    assert.deepEqual(received, [{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  test('respects a custom Parser with its own frameDelimiter', async function (assert) {
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\x1e{"a":2}\x1e'], 'application/x-custom'));

    const customParser: Parser = {
      stream: true,
      frameDelimiter: '\x1e',
      parse: (chunk: string, isFull: boolean) => (isFull ? chunk : (JSON.parse(chunk) as unknown)),
    };

    const manager = new RequestManager();
    manager.use([Fetch]);

    const received: unknown[] = [];
    await manager.request({
      url: 'https://example.com/stream',
      options: {
        parser: customParser,
        onChunk: (chunk: unknown) => received.push(chunk),
      },
    });

    assert.deepEqual(received, [{ a: 1 }, { a: 2 }]);
  });

  test('onChunk is rejected when the selected parser does not support streaming', async function (assert) {
    globalThis.fetch = () => Promise.resolve(jsonResponse({ a: 1 }));

    const manager = new RequestManager();
    manager.use([Fetch]);

    const received: unknown[] = [];
    try {
      await manager.request({
        url: 'https://example.com/basic',
        options: { onChunk: (chunk: unknown) => received.push(chunk) },
      });
      assert.ok(false, 'expected the request to reject');
    } catch (e) {
      assert.true(
        e instanceof Error && e.message.includes('does not support streaming'),
        'misconfiguring onChunk with a non-streaming parser throws a helpful error'
      );
    }
    assert.deepEqual(received, [], 'onChunk was never called');
  });
});
