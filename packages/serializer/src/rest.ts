/**
 * Legacy alias of {@link @warp-drive/legacy!serializer/rest | @warp-drive/legacy/serializer/rest}.
 * This entry re-exports the REST serializer from that module unchanged so existing
 * `@ember-data/serializer/rest` imports keep working; new code should import
 * from `@warp-drive/legacy/serializer/rest` directly.
 *
 * @module
 */
export { RESTSerializer as default, EmbeddedRecordsMixin } from '@warp-drive/legacy/serializer/rest';
