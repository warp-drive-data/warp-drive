import type { Value } from '../../../types/json/raw';

/**
 * Options shared by {@link FindRecordOptions} and {@link FindAllOptions}
 * for controlling reload behavior and adapter/serializer specific
 * configuration when using the legacy Adapter/Serializer network layer.
 */
export interface BaseFinderOptions {
  /**
   * If `true`, forces the request to go to the adapter even if a cached
   * copy of the requested resource(s) already exists in the store. If
   * omitted, the adapter's `shouldReloadRecord`/`shouldReloadAll` hook
   * decides whether to reload.
   */
  reload?: boolean;

  /**
   * If `true` or `false`, forces or prevents a background reload of the
   * cached resource(s) after resolving with the cached data. If omitted,
   * the adapter's `shouldBackgroundReloadRecord`/`shouldBackgroundReloadAll`
   * hook decides whether to reload in the background.
   */
  backgroundReload?: boolean;

  /**
   * The names of relationships to load along with this request, used to
   * build the `include` query parameter for adapters (such as the
   * JSON:API adapter) that support it.
   */
  include?: string | string[];

  /**
   * Arbitrary options made available to the adapter via the request's
   * snapshot (`snapshot.adapterOptions`). The store does not interpret
   * this value itself.
   */
  adapterOptions?: Record<string, unknown>;
}
/**
 * Options for `store.findRecord()`.
 */
export interface FindRecordOptions extends BaseFinderOptions {
  /**
   * Data to preload into the store before the request is made.
   * This feature is *highly* discouraged and has no corresponding
   * feature when using builders and handlers.
   *
   * Excepting relationships: the data should be in the form of a
   * JSON object where the keys are fields on the record and the value
   * is the raw value to be added to the cache.
   *
   * Relationships can either be provided as string IDs from which
   * an identifier will be built base upon the relationship's expected
   * resource type, or be record instances from which the identifier
   * will be extracted.
   *
   */
  preload?: Record<string, Value>;
}

/**
 * Options for `store.query()` and `store.queryRecord()`. Unlike
 * {@link LegacyResourceQuery}, these options are not sent to the server;
 * only `adapterOptions` is recognized by the store, and it is passed
 * through to `adapter.query`/`adapter.queryRecord` via the request snapshot.
 */
export type QueryOptions = {
  [K in string | 'adapterOptions']?: K extends 'adapterOptions' ? Record<string, unknown> : unknown;
};

/**
 * Options for `store.findAll()`.
 */
export type FindAllOptions = BaseFinderOptions;

/**
 * An opaque query object for `store.query()` and `store.queryRecord()`
 * that is passed as-is to the adapter, which is responsible for turning
 * it into request query parameters.
 */
export type LegacyResourceQuery = {
  /**
   * The names of relationships to load along with this query, used to
   * build the `include` query parameter for adapters (such as the
   * JSON:API adapter) that support it.
   */
  include?: string | string[];
  [key: string]: Value | undefined;
};
