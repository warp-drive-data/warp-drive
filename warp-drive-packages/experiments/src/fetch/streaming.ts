import type { Store } from '@warp-drive/core';
import type { ExistingResourceObject } from '@warp-drive/core/types/spec/json-api-raw';

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
 * import { streamJsonLines } from '@warp-drive/experiments/fetch';
 *
 * for await (const event of streamJsonLines(response.body)) {
 *   // handle each decoded line as it arrives
 * }
 * ```
 *
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

/**
 * Options for {@link streamIntoResource}.
 *
 * @public
 */
export interface StreamIntoResourceOptions<TResource extends ExistingResourceObject, TChunk> {
  /**
   * The store to push updates into.
   */
  store: Store;
  /**
   * The resource to fold incoming chunks into and push to the cache.
   * Callers are responsible for resolving this to either an existing
   * cached resource (e.g. via `store.cache.peekRemoteState`) or a freshly
   * constructed placeholder before calling {@link streamIntoResource}.
   */
  resource: TResource;
  /**
   * The decoded chunks to fold into {@link StreamIntoResourceOptions.resource | resource},
   * e.g. from {@link streamJsonLines}.
   */
  source: AsyncIterable<TChunk>;
  /**
   * Applies a single decoded chunk to the current resource, returning the
   * next version of the resource. Called once per chunk, in order.
   */
  reduce: (resource: TResource, chunk: TChunk) => TResource;
  /**
   * Called once {@link StreamIntoResourceOptions.source | source} is
   * exhausted, including when it throws, so that a final flag (e.g.
   * `isStreaming: false`) can be applied before the last push. Its return
   * value (if any) becomes the final resource; returning nothing keeps the
   * resource as last reduced.
   */
  onSettled?: (resource: TResource) => TResource | void;
}

/**
 * Iterates an async source of decoded stream chunks, folding each into
 * `resource` via `reduce` and pushing the result into the store's cache
 * after every chunk. This is the reactive-normalization half of consuming a
 * streamed response: use a decoder like {@link streamJsonLines} to turn the
 * response body into structured chunks, then use `streamIntoResource` to
 * turn each chunk into a cache update as it arrives, so subscribers see the
 * resource grow in place rather than waiting for the whole response.
 *
 * @example
 * ```ts
 * import { streamJsonLines, streamIntoResource } from '@warp-drive/experiments/fetch';
 *
 * const resource = await streamIntoResource({
 *   store,
 *   resource: { type: 'assistant', id: conversationId, attributes: { messages: [], isStreaming: true } },
 *   source: streamJsonLines(response.body),
 *   reduce: (resource, event) => ({
 *     ...resource,
 *     attributes: { ...resource.attributes, messages: [...resource.attributes.messages, event] },
 *   }),
 *   onSettled: (resource) => ({ ...resource, attributes: { ...resource.attributes, isStreaming: false } }),
 * });
 * ```
 *
 * @public
 */
export async function streamIntoResource<TResource extends ExistingResourceObject, TChunk>(
  options: StreamIntoResourceOptions<TResource, TChunk>
): Promise<TResource> {
  const { store, source, reduce } = options;
  let resource = options.resource;

  try {
    for await (const chunk of source) {
      resource = reduce(resource, chunk);
      store.push({ data: resource });
    }
  } finally {
    resource = options.onSettled?.(resource) ?? resource;
    store.push({ data: resource });
  }

  return resource;
}
