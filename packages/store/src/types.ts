/**
 * Legacy alias of {@link @warp-drive/core!types | @warp-drive/core/types}.
 * This entry re-exports the store's public types from that module unchanged so existing
 * `@ember-data/store/types` imports keep working; new code should import
 * from `@warp-drive/core/types` directly.
 *
 * @module
 */
export type {
  CacheCapabilitiesManager,
  ModelSchema,
  SchemaService,
  BaseFinderOptions,
  FindRecordOptions,
  LegacyResourceQuery,
  QueryOptions,
  FindAllOptions,
} from '@warp-drive/core/types';
