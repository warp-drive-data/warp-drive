/**
 * @module
 * @summary Experimental reactive wrappers over localStorage, sessionStorage and the Cache API, with decorators such as
 * `LocalResource` and `param` that bind class fields to storage or query params.
 */

export * from './storage/storage.ts';
export type * from './storage/storage.ts';
export * from './storage/storage-resource.ts';
export type * from './storage/storage-resource.ts';
export * from './storage/cache.ts';
export type * from './storage/cache.ts';
export * from './storage/query-params.ts';
export type * from './storage/query-params.ts';
export type { KeyFn, ValueTransition } from './storage/-private/storage-infra.ts';
export {
  initMeta as _initMeta,
  getParamCompanion as _getParamCompanion,
  initializeFields as _initializeFields,
} from './storage/-private/storage-infra.ts';
