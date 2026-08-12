import type { Store } from '@warp-drive/core';
import type { ExistingResourceObject } from '@warp-drive/core/types/spec/json-api-raw';

/**
 * Options for {@link streamIntoResource}.
 *
 * @public
 */
export interface StreamIntoResourceOptions<TResource extends ExistingResourceObject, TChunk> {
  /**
   * The {@link Store} to push updates into.
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
 * import { streamJsonLines, streamIntoResource } from '@warp-drive/utilities/streaming';
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
 * @param options - see {@link StreamIntoResourceOptions}
 * @return the final, fully-reduced resource
 * @since 5.9.0
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
