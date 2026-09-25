/**
 * Legacy alias of {@link @warp-drive/utilities!active-record | @warp-drive/utilities/active-record}.
 * This entry re-exports the request builders from that module unchanged so existing
 * `@ember-data/active-record/request` imports keep working; new code should import
 * from `@warp-drive/utilities/active-record` directly.
 *
 * @summary Legacy alias that re-exports the ActiveRecord-style request builders (`findRecord`, `query`, `createRecord`,
 * `updateRecord`, `deleteRecord`) from `@warp-drive/utilities/active-record`.
 * @module
 */
export { findRecord, query, deleteRecord, createRecord, updateRecord } from '@warp-drive/utilities/active-record';
