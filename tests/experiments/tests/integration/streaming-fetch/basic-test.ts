import { Fetch, RequestManager } from '@warp-drive/core';
import type { Future, Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import { module, test } from '@warp-drive/diagnostic';
import type { Parser } from '@warp-drive/experiments/streaming-fetch';
import { StreamingFetch, withChunkHandler } from '@warp-drive/experiments/streaming-fetch';

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

module('Integration | StreamingFetch', function (hooks) {
  const originalFetch = globalThis.fetch;

  hooks.afterEach(function () {
    globalThis.fetch = originalFetch;
  });

  test('calls onChunk once per NDJSON line, in order, as the response streams in', async function (assert) {
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\n{"a"', ':2}\n{"a":3}\n']));

    const manager = new RequestManager();
    manager.use([new StreamingFetch(), Fetch]);

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
    manager.use([new StreamingFetch(), Fetch]);

    const received: unknown[] = [];
    await manager.request({
      url: 'https://example.com/stream',
      options: {
        onChunk: (chunk: unknown) => received.push(chunk),
      },
    });

    assert.deepEqual(received, [{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  test('respects a custom Parser with its own frameDelimiter', async function (assert) {
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\x1e{"a":2}\x1e'], 'application/x-custom'));

    const customParser: Parser = {
      frameDelimiter: '\x1e',
      parse: (chunk: string, isFull: boolean) => (isFull ? chunk : (JSON.parse(chunk) as unknown)),
    };

    const manager = new RequestManager();
    manager.use([new StreamingFetch(), Fetch]);

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

  test('requests without onChunk pass through to the next handler unchanged', async function (assert) {
    assert.expect(2);
    const passthroughHandler: Handler = {
      request<T>(context: RequestContext, _next: NextFn<T>): Promise<T> | Future<T> {
        assert.step('reached the next handler');
        return Promise.resolve({ ok: true } as T);
      },
    };

    const manager = new RequestManager();
    manager.use([new StreamingFetch(), passthroughHandler]);

    const doc = await manager.request({ url: 'https://example.com/basic' });
    assert.deepEqual(doc.content, { ok: true }, 'the passthrough handler response is used unchanged');
    assert.verifySteps(['reached the next handler']);
  });

  test('a non-ok response rejects with a helpful error', async function (assert) {
    globalThis.fetch = () =>
      Promise.resolve(new Response('not found', { status: 404, statusText: 'Not Found' }));

    const manager = new RequestManager();
    manager.use([new StreamingFetch(), Fetch]);

    try {
      await manager.request({
        url: 'https://example.com/missing',
        options: { onChunk: (chunk: unknown) => chunk },
      });
      assert.ok(false, 'expected the request to reject');
    } catch (e) {
      assert.true(e instanceof Error, 'the error is an Error');
      assert.equal((e as Error & { status: number }).status, 404, 'the error carries the status code');
      assert.equal((e as Error & { content: string }).content, 'not found', 'the error carries the response body');
    }
  });
});
