import RequestManager from '@ember-data/request';
import Fetch from '@ember-data/request/fetch';
import type { Parser } from '@warp-drive/core';
import { withChunkHandler } from '@warp-drive/core/request';
import { module, test } from '@warp-drive/diagnostic';

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

module('RequestManager | Fetch Handler | Streaming', function (hooks) {
  const originalFetch = globalThis.fetch;

  hooks.beforeEach(function () {
    // force the real (non-Mirage) streaming code path: our stubbed
    // `globalThis.fetch` below would otherwise trip the Mirage heuristic,
    // since it doesn't match the native `fetch` function's toString().
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    globalThis.setWarpDriveIsMaybeMirage(false);
  });

  hooks.afterEach(function () {
    globalThis.fetch = originalFetch;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    delete globalThis.getWarpDriveRuntimeConfig().mirage;
  });

  test('calls onChunk once per NDJSON line, in order, as the response streams in', async function (assert) {
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\n{"a"', ':2}\n{"a":3}\n']));

    const manager = new RequestManager();
    manager.use([Fetch]);

    const received: unknown[] = [];
    const doc = await manager.request<{ a: number }[]>({
      url: 'https://example.com/stream',
      headers: new Headers({ Accept: 'application/x-ndjson' }),
      options: {
        parserType: 'ndjson',
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
      headers: new Headers({ Accept: 'application/x-ndjson' }),
      options: {
        parserType: 'ndjson',
        onChunk: (chunk: unknown) => received.push(chunk),
      },
    });

    assert.deepEqual(received, [{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  test('respects a parser-declared frameDelimiter other than newline', async function (assert) {
    globalThis.fetch = () => Promise.resolve(streamOf(['{"a":1}\x1e{"a":2}\x1e'], 'application/x-custom'));

    const customParser: Parser = {
      stream: true,
      frameDelimiter: '\x1e',
      parse: (chunk: string, isFull: boolean) => (isFull ? chunk : (JSON.parse(chunk) as unknown)),
    };

    const manager = new RequestManager();
    manager.use([
      new Fetch({
        parserType: () => 'custom',
        parsers: { custom: customParser },
      }),
    ]);

    const received: unknown[] = [];
    await manager.request({
      url: 'https://example.com/stream',
      options: {
        onChunk: (chunk: unknown) => received.push(chunk),
      },
    });

    assert.deepEqual(received, [{ a: 1 }, { a: 2 }]);
  });

  test('onChunk is never called when the selected parser does not declare stream support', async function (assert) {
    globalThis.fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ a: 1 }), { headers: { 'content-type': 'application/json' } }));

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
