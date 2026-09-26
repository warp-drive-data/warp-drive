/**
 * @module
 * @summary Request-layer types such as `Future`, `Handler` and `Context`, plus `withResponseType` and
 * `withReactiveResponse` for typing the response a request resolves with.
 */

import type { ReactiveDataDocument } from './reactive.ts';
import type { RequestInfo } from './types/request.ts';
import type { Meta } from './types/spec/json-api-raw.ts';
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
 * @summary Types a request object with the response type that `store.request` or `RequestManager.request`
 * should resolve with; no runtime effect.
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
 * Pass a second type param to declare the `meta` the endpoint returns:
 *
 * ```ts
 * type PageMeta = { page: { limit: number; offset: number }; total?: number };
 *
 * const result = await store.request(
 *   withReactiveResponse<User[], PageMeta>({ url: '/users' })
 * );
 *
 * result.content.meta?.total; // number | undefined
 * ```
 *
 * @summary Types a request object so its response resolves as a `ReactiveDataDocument` of the given
 * data and meta types; no runtime effect.
 * @public
 */
export function withReactiveResponse<
  T,
  M extends Meta | undefined = Meta | undefined,
  E extends object = object,
  EM extends Meta | undefined = M,
>(
  obj: RequestInfo
): RequestInfo<ReactiveDataDocument<T, M, E, EM>> & {
  /** The branded response type. Present only at the type level; carries no runtime value. */
  [RequestSignature]: ReactiveDataDocument<T, M, E, EM>;
} {
  return obj as RequestInfo<ReactiveDataDocument<T, M, E, EM>> & {
    [RequestSignature]: ReactiveDataDocument<T, M, E, EM>;
  };
}

/**
 * @summary Deprecated alias for `withResponseType`, which types a request object with its expected
 * response type.
 * @deprecated use {@link withResponseType} instead
 */
export const withBrand: typeof withResponseType = withResponseType;
