import { getOrSetUniversal } from '../../types/-private';

export type CacheResult<T = unknown, E = unknown> = { isError: true; result: E } | { isError: false; result: T };

/**
 * The minimal, structural subset of the `Promise` interface required to be
 * cached and inspected by {@link setPromiseResult} / {@link getPromiseResult}
 * (and by `getPromiseState`). Anything that is at least `then`/`catch`/`finally`
 * "shaped" (including a real `Promise` or {@link Future}) satisfies this.
 *
 * @public
 */
export type Awaitable<T = unknown, E = unknown> = {
  /**
   * Registers fulfillment/rejection handlers, `Promise.prototype.then`-style.
   *
   * @public
   */
  then: (onFulfilled: (value: T) => unknown, onRejected: (reason: E) => unknown) => unknown;
  /**
   * Registers a rejection handler, `Promise.prototype.catch`-style.
   *
   * @public
   */
  catch: (onRejected: (reason: E) => unknown) => unknown;
  /**
   * Registers a handler run on settlement, `Promise.prototype.finally`-style.
   *
   * @public
   */
  finally: (onFinally: () => unknown) => unknown;
};

export const PromiseCache: WeakMap<Awaitable, CacheResult> = getOrSetUniversal(
  'PromiseCache',
  new WeakMap<Awaitable, CacheResult>()
);
export const RequestMap: Map<number, CacheResult> = getOrSetUniversal('RequestMap', new Map<number, CacheResult>());

export function setRequestResult(requestId: number, result: CacheResult): void {
  RequestMap.set(requestId, result);
}
export function clearRequestResult(requestId: number): void {
  RequestMap.delete(requestId);
}
export function getRequestResult(requestId: number): CacheResult | undefined {
  return RequestMap.get(requestId);
}

/**
 * Cache the settled result (or error) of a promise-like value so that its
 * outcome can be synchronously read later via {@link getPromiseResult},
 * without needing to await it again.
 *
 * @public
 */
export function setPromiseResult(promise: Promise<unknown> | Awaitable, result: CacheResult): void {
  PromiseCache.set(promise, result);
}

/**
 * Synchronously read the settled result (or error) previously recorded for
 * a promise-like value via {@link setPromiseResult}, if any.
 *
 * @public
 */
export function getPromiseResult<T, E>(promise: Promise<T> | Awaitable<T, E>): CacheResult<T, E> | undefined {
  return PromiseCache.get(promise) as CacheResult<T, E> | undefined;
}
