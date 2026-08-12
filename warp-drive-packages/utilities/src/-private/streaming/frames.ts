/**
 * Reads a byte stream and yields it as a sequence of text frames split on
 * `delimiter` (default `'\n'`), decoding incrementally so that a delimiter
 * split across two underlying chunks is still detected correctly.
 *
 * If the stream ends with trailing content after the last delimiter, that
 * content is yielded as a final frame.
 *
 * If the consumer stops iterating early (e.g. via `break`), the underlying
 * stream is canceled.
 *
 * @example
 * ```ts
 * import { streamFrames } from '@warp-drive/utilities/streaming';
 *
 * for await (const frame of streamFrames(response.body, '\x1e')) {
 *   // handle each frame as it arrives
 * }
 * ```
 *
 * @param body - the byte stream to read, e.g. a {@link Response.body | response body}
 * @param delimiter - the string that separates frames
 * @since 5.9.0
 * @public
 */
export async function* streamFrames(
  body: ReadableStream<Uint8Array>,
  delimiter = '\n'
): AsyncGenerator<string, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let index: number;
      while ((index = buffer.indexOf(delimiter)) !== -1) {
        yield buffer.slice(0, index);
        buffer = buffer.slice(index + delimiter.length);
      }
    }

    buffer += decoder.decode();
    if (buffer.length) {
      yield buffer;
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}

/**
 * Options for {@link streamJsonLines}.
 *
 * @public
 */
export interface StreamJsonLinesOptions {
  /**
   * Called when a frame fails to parse as JSON. If omitted, unparsable
   * frames are silently skipped.
   */
  onParseError?: (frame: string, error: unknown) => void;
}

/**
 * Decodes a newline-delimited JSON (NDJSON) byte stream into a sequence of
 * parsed values, yielding each as soon as its line arrives. Blank lines are
 * skipped; lines that fail to parse are skipped (or reported via
 * {@link StreamJsonLinesOptions.onParseError | onParseError}) rather than
 * aborting the stream.
 *
 * Built on {@link streamFrames}.
 *
 * @example
 * ```ts
 * import { streamJsonLines } from '@warp-drive/utilities/streaming';
 *
 * for await (const event of streamJsonLines(response.body)) {
 *   // handle each decoded line as it arrives
 * }
 * ```
 *
 * @param body - the byte stream to read, e.g. a {@link Response.body | response body}
 * @param options - see {@link StreamJsonLinesOptions}
 * @since 5.9.0
 * @public
 */
export async function* streamJsonLines<T = unknown>(
  body: ReadableStream<Uint8Array>,
  options?: StreamJsonLinesOptions
): AsyncGenerator<T, void, void> {
  for await (const frame of streamFrames(body, '\n')) {
    const trimmed = frame.trim();
    if (!trimmed) continue;
    try {
      yield JSON.parse(trimmed) as T;
    } catch (e) {
      options?.onParseError?.(trimmed, e);
    }
  }
}
