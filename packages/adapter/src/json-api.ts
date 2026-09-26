/**
 * Legacy alias of {@link @warp-drive/legacy!adapter/json-api | @warp-drive/legacy/adapter/json-api}.
 * This entry re-exports the JSON:API adapter from that module unchanged so existing
 * `@ember-data/adapter/json-api` imports keep working; new code should import
 * from `@warp-drive/legacy/adapter/json-api` directly.
 *
 * @summary Legacy alias that re-exports `JSONAPIAdapter` from `@warp-drive/legacy/adapter/json-api` so
 * `@ember-data/adapter/json-api` imports keep working.
 * @module
 */
export { JSONAPIAdapter as default } from '@warp-drive/legacy/adapter/json-api';
