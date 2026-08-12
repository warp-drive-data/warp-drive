import { streamFrames, streamJsonLines } from '@ember-data/request-utils/streaming';
import { module, test } from '@warp-drive/diagnostic';

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of source) {
    result.push(value);
  }
  return result;
}

module('Unit | streaming | streamFrames', function () {
  test('splits a single chunk on the default newline delimiter', async function (assert) {
    const frames = await collect(streamFrames(streamOf(['a\nb\nc'])));
    assert.deepEqual(frames, ['a', 'b', 'c']);
  });

  test('yields trailing content with no terminating delimiter', async function (assert) {
    const frames = await collect(streamFrames(streamOf(['a\nb'])));
    assert.deepEqual(frames, ['a', 'b']);
  });

  test('drops nothing when the stream ends exactly on a delimiter', async function (assert) {
    const frames = await collect(streamFrames(streamOf(['a\nb\n'])));
    assert.deepEqual(frames, ['a', 'b']);
  });

  test('reassembles a delimiter split across two chunks', async function (assert) {
    const frames = await collect(streamFrames(streamOf(['a\n', 'b'])));
    assert.deepEqual(frames, ['a', 'b']);
  });

  test('reassembles a multi-byte UTF-8 character split across two chunks', async function (assert) {
    // 'é' is encoded as two bytes in UTF-8; split the raw bytes down the middle.
    const encoder = new TextEncoder();
    const bytes = encoder.encode('café\nau lait');
    const splitPoint = bytes.indexOf(0xa9) + 1; // inside the 2-byte 'é' sequence
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, splitPoint));
        controller.enqueue(bytes.slice(splitPoint));
        controller.close();
      },
    });

    const frames = await collect(streamFrames(stream));
    assert.deepEqual(frames, ['café', 'au lait']);
  });

  test('supports a custom delimiter', async function (assert) {
    const frames = await collect(streamFrames(streamOf(['a\x1eb\x1ec']), '\x1e'));
    assert.deepEqual(frames, ['a', 'b', 'c']);
  });

  test('yields nothing for an empty stream', async function (assert) {
    const frames = await collect(streamFrames(streamOf([])));
    assert.deepEqual(frames, []);
  });

  test('cancels the underlying stream when the consumer stops iterating early', async function (assert) {
    let canceled: unknown = 'not-canceled';
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('a\nb\nc\n'));
      },
      cancel(reason) {
        canceled = reason;
      },
    });

    for await (const frame of streamFrames(stream)) {
      assert.equal(frame, 'a');
      break;
    }

    // cancellation is async; let the microtask queue flush
    await Promise.resolve();
    assert.notEqual(canceled, 'not-canceled', 'the underlying stream was canceled');
  });
});

module('Unit | streaming | streamJsonLines', function () {
  test('parses each line as JSON', async function (assert) {
    const values = await collect(streamJsonLines(streamOf(['{"a":1}\n{"a":2}\n'])));
    assert.deepEqual(values, [{ a: 1 }, { a: 2 }]);
  });

  test('skips blank lines', async function (assert) {
    const values = await collect(streamJsonLines(streamOf(['{"a":1}\n\n{"a":2}\n'])));
    assert.deepEqual(values, [{ a: 1 }, { a: 2 }]);
  });

  test('skips unparsable lines by default', async function (assert) {
    const values = await collect(streamJsonLines(streamOf(['{"a":1}\nnot json\n{"a":2}\n'])));
    assert.deepEqual(values, [{ a: 1 }, { a: 2 }]);
  });

  test('reports unparsable lines via onParseError without aborting the stream', async function (assert) {
    const errors: string[] = [];
    const values = await collect(
      streamJsonLines(streamOf(['{"a":1}\nnot json\n{"a":2}\n']), {
        onParseError: (frame) => errors.push(frame),
      })
    );
    assert.deepEqual(values, [{ a: 1 }, { a: 2 }]);
    assert.deepEqual(errors, ['not json']);
  });
});
