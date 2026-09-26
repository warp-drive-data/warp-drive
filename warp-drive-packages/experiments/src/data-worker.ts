/**
 * @module
 * @summary Experimental `DataWorker`, which runs a store inside a Worker or SharedWorker, and the `CacheHandler` it
 * uses to serve requests from its in-memory or persisted cache.
 */

export { DataWorker } from './data-worker/worker';
export { CacheHandler } from './data-worker/cache-handler';
