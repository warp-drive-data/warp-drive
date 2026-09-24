/**
 * Legacy alias of {@link @warp-drive/legacy!adapter/rest | @warp-drive/legacy/adapter/rest}.
 * This entry re-exports the REST adapter from that module unchanged so existing
 * `@ember-data/adapter/rest` imports keep working; new code should import
 * from `@warp-drive/legacy/adapter/rest` directly.
 *
 * @module
 */
export {
  RESTAdapter as default,
  fetchOptions,
  type QueryState,
  type FetchRequestInit,
  type JQueryRequestInit,
  type RequestData,
} from '@warp-drive/legacy/adapter/rest';
