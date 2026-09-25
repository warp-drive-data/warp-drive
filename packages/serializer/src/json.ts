/**
 * Legacy alias of {@link @warp-drive/legacy!serializer/json | @warp-drive/legacy/serializer/json}.
 * This entry re-exports the JSON serializer from that module unchanged so existing
 * `@ember-data/serializer/json` imports keep working; new code should import
 * from `@warp-drive/legacy/serializer/json` directly.
 *
 * @summary Legacy alias that re-exports `JSONSerializer` from `@warp-drive/legacy/serializer/json` so
 * `@ember-data/serializer/json` imports keep working.
 * @module
 */
export { JSONSerializer as default } from '@warp-drive/legacy/serializer/json';
