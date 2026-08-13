import type { ReactiveDataDocument } from './reactive.ts';
import type { Context } from './request/-private/context.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Fetch, Parser } from './request/-private/fetch.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ImmutableRequestInfo, RequestInfo } from './types/request.ts';
import type { RequestSignature } from './types/symbols.ts';

export { createDeferred } from './request/-private/future.ts';
export type {
  Future,
  Handler,
  CacheHandler,
  NextFn,
  Deferred,
  ManagedRequestPriority,
} from './request/-private/types.ts';
export { setPromiseResult, getPromiseResult } from './request/-private/promise-cache.ts';
export type { Awaitable } from './request/-private/promise-cache.ts';
export type { Context } from './request/-private/context.ts';

/**
 * Brands the supplied object with the supplied response type.
 *
 * ```ts
 * import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
 * import { withResponseType } from '@warp-drive/core/request';
 * import type { User } from '#/data/user.ts'
 *
 * const result = await store.request(
 *  withResponseType<ReactiveDataDocument<User>>({ url: '/users/1' })
 * );
 *
 * result.content.data; // will have type User
 * ```
 *
 */
export function withResponseType<T>(obj: RequestInfo): RequestInfo<T> & {
  /** The branded response type. Present only at the type level; carries no runtime value. */
  [RequestSignature]: T;
} {
  return obj as RequestInfo<T> & {
    [RequestSignature]: T;
  };
}

/**
 * Brands the supplied object with the supplied response type
 * wrapped in {@link ReactiveDataDocument}. This is a convenience for
 * the common case of using {@link withResponseType} with `ReactiveDataDocument`.
 *
 * ```ts
 * import { withReactiveResponse } from '@warp-drive/core/request';
 * import type { User } from '#/data/user.ts'
 *
 * const result = await store.request(
 *   withReactiveResponse<User>({ url: '/users/1' })
 * );
 *
 * result.content.data; // will have type User
 * ```
 *
 * @public
 */
export function withReactiveResponse<T>(obj: RequestInfo): RequestInfo<ReactiveDataDocument<T>> & {
  /** The branded response type. Present only at the type level; carries no runtime value. */
  [RequestSignature]: ReactiveDataDocument<T>;
} {
  return obj as RequestInfo<ReactiveDataDocument<T>> & {
    [RequestSignature]: ReactiveDataDocument<T>;
  };
}

/**
 * @deprecated use {@link withResponseType} instead
 */
export const withBrand: typeof withResponseType = withResponseType;

/**
 * Types the `chunk` parameter of a {@link ImmutableRequestInfo.options | options.onChunk}
 * handler, for use with a streaming-capable {@link Parser} (see {@link Fetch}).
 * Present only at the type level; at runtime this returns `handler` unchanged.
 *
 * @example
 * ```ts
 * import { withChunkHandler } from '@warp-drive/core/request';
 * import type { Message } from '#/data/types';
 *
 * store.request({
 *   url: '/api/assistant/stream',
 *   options: {
 *     parserType: 'ndjson',
 *     onChunk: withChunkHandler<Message>((message, context) => {
 *       // message is typed as Message
 *     }),
 *   },
 * });
 * ```
 *
 * @since 5.9.0
 * @public
 */
export function withChunkHandler<T>(
  handler: (chunk: T, context: Context) => void
): (chunk: unknown, context: Context) => void {
  return handler as (chunk: unknown, context: Context) => void;
}
