/**
 * String utilties for transforming and inflecting strings useful for
 * when the format provided by the server is not the format you want to use
 * in your application.
 *
 * Each transformation function stores its results in an LRUCache to avoid
 * recomputing the same value multiple times. The cache size can be set
 * using the `setMaxLRUCacheSize` function. The default size is 10,000.
 *
 * @summary Re-exports LRU-cached string inflection and case helpers (`pluralize`, `singularize`, `camelize`,
 * `dasherize`, and others) from `@warp-drive/utilities/string`.
 * @module
 */
export * from '@warp-drive/utilities/string';
