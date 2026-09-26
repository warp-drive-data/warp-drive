/**
 * Legacy alias of {@link @warp-drive/legacy!serializer/json-api | @warp-drive/legacy/serializer/json-api}.
 * This entry re-exports the JSON:API serializer from that module unchanged so existing
 * `@ember-data/serializer/json-api` imports keep working; new code should import
 * from `@warp-drive/legacy/serializer/json-api` directly.
 *
 * @summary Legacy alias that re-exports `JSONAPISerializer` from `@warp-drive/legacy/serializer/json-api` so
 * `@ember-data/serializer/json-api` imports keep working.
 * @module
 */
export { JSONAPISerializer as default } from '@warp-drive/legacy/serializer/json-api';
