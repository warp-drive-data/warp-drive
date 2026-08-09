/**
 * @module
 * @mergeModuleWith <project>
 */

import { assert } from '@warp-drive/core/build-config/macros';
import { getOrSetGlobal } from '@warp-drive/core/types/-private';
import type { QueryParamsSerializationOptions, QueryParamsSource, Serializable } from '@warp-drive/core/types/params';

// prevents the final constructed object from needing to add
// host and namespace which are provided by the final consuming
// class to the prototype which can result in overwrite errors

/**
 * The global configuration used by {@link buildBaseURL} when a call does
 * not provide its own `host`/`namespace`. Set via {@link setBuildURLConfig}.
 *
 * @public
 */
export interface BuildURLConfig {
  /**
   * The scheme, domain and port (if any) to prefix built URLs with, e.g. `'https://api.example.com'`.
   */
  host: string | null;
  /**
   * The path segment to insert between `host` and the resource path, e.g. `'api/v1'`.
   */
  namespace: string | null;
}

const CONFIG: BuildURLConfig = getOrSetGlobal('CONFIG', {
  host: '',
  namespace: '',
});

/**
 * Sets the global configuration for `buildBaseURL`
 * for host and namespace values for the application.
 *
 * These values may still be overridden by passing
 * them to buildBaseURL directly.
 *
 * This method may be called as many times as needed.
 * host values of `''` or `'/'` are equivalent.
 *
 * Except for the value of `/` as host, host should not
 * end with `/`.
 *
 * namespace should not start or end with a `/`.
 *
 * ```ts
 * type BuildURLConfig = {
 *   host: string;
 *   namespace: string'
 * }
 * ```
 *
 * Example:
 *
 * ```ts
 * import { setBuildURLConfig } from '@warp-drive/utilities';
 *
 * setBuildURLConfig({
 *   host: 'https://api.example.com',
 *   namespace: 'api/v1'
 * });
 * ```
 *
 * @public
 */
export function setBuildURLConfig(config: BuildURLConfig): void {
  assert(`setBuildURLConfig: You must pass a config object`, config);
  assert(
    `setBuildURLConfig: You must pass a config object with a 'host' or 'namespace' property`,
    'host' in config || 'namespace' in config
  );

  CONFIG.host = config.host || '';
  CONFIG.namespace = config.namespace || '';

  assert(
    `buildBaseURL: host must NOT end with '/', received '${CONFIG.host}'`,
    CONFIG.host === '/' || !CONFIG.host.endsWith('/')
  );
  assert(
    `buildBaseURL: namespace must NOT start with '/', received '${CONFIG.namespace}'`,
    !CONFIG.namespace.startsWith('/')
  );
  assert(
    `buildBaseURL: namespace must NOT end with '/', received '${CONFIG.namespace}'`,
    !CONFIG.namespace.endsWith('/')
  );
}

/**
 * {@link buildBaseURL} options for a `findRecord` request.
 *
 * @public
 */
export interface FindRecordUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'findRecord';
  /**
   * The type and id of the record to find.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
    /**
     * The resource id.
     */
    id: string;
  };
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for a `query` request.
 *
 * @public
 */
export interface QueryUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'query';
  /**
   * The type of the records to query.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
  };
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for a `findMany` request.
 *
 * @public
 */
export interface FindManyUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'findMany';
  /**
   * The type and id of each record to find.
   */
  identifiers: {
    /**
     * The resource type.
     */
    type: string;
    /**
     * The resource id.
     */
    id: string;
  }[];
  /**
   * The path segment for the resource, defaults to the first identifier's `type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}
/**
 * {@link buildBaseURL} options for a `findRelatedCollection` request.
 *
 * @public
 */
export interface FindRelatedCollectionUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'findRelatedCollection';
  /**
   * The type and id of the record whose relationship is being fetched.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
    /**
     * The resource id.
     */
    id: string;
  };
  /**
   * The relationship field name, appended to the resource path.
   */
  fieldPath: string;
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for a `findRelatedRecord` request.
 *
 * @public
 */
export interface FindRelatedResourceUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'findRelatedRecord';
  /**
   * The type and id of the record whose relationship is being fetched.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
    /**
     * The resource id.
     */
    id: string;
  };
  /**
   * The relationship field name, appended to the resource path.
   */
  fieldPath: string;
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for a `createRecord` request.
 *
 * @public
 */
export interface CreateRecordUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'createRecord';
  /**
   * The type of the record being created.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
  };
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for an `updateRecord` request.
 *
 * @public
 */
export interface UpdateRecordUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'updateRecord';
  /**
   * The type and id of the record being updated.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
    /**
     * The resource id.
     */
    id: string;
  };
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for a `deleteRecord` request.
 *
 * @public
 */
export interface DeleteRecordUrlOptions {
  /**
   * The request operation this URL is for.
   */
  op: 'deleteRecord';
  /**
   * The type and id of the record being deleted.
   */
  identifier: {
    /**
     * The resource type.
     */
    type: string;
    /**
     * The resource id.
     */
    id: string;
  };
  /**
   * The path segment for the resource, defaults to `identifier.type` if not provided.
   */
  resourcePath?: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * {@link buildBaseURL} options for building a URL directly from a `resourcePath`
 * without an associated request operation.
 *
 * @public
 */
export interface GenericUrlOptions {
  /**
   * The path segment for the resource.
   */
  resourcePath: string;
  /**
   * Overrides the globally configured host for this call only.
   */
  host?: string;
  /**
   * Overrides the globally configured namespace for this call only.
   */
  namespace?: string;
}

/**
 * The union of all `op`-specific option shapes accepted by {@link buildBaseURL}, one of:
 *
 * - {@link FindRecordUrlOptions}
 * - {@link QueryUrlOptions}
 * - {@link FindManyUrlOptions}
 * - {@link FindRelatedCollectionUrlOptions}
 * - {@link FindRelatedResourceUrlOptions}
 * - {@link CreateRecordUrlOptions}
 * - {@link UpdateRecordUrlOptions}
 * - {@link DeleteRecordUrlOptions}
 * - {@link GenericUrlOptions}
 *
 * @public
 */
export type UrlOptions =
  | FindRecordUrlOptions
  | QueryUrlOptions
  | FindManyUrlOptions
  | FindRelatedCollectionUrlOptions
  | FindRelatedResourceUrlOptions
  | CreateRecordUrlOptions
  | UpdateRecordUrlOptions
  | DeleteRecordUrlOptions
  | GenericUrlOptions;

const OPERATIONS_WITH_PRIMARY_RECORDS = new Set([
  'findRecord',
  'findRelatedRecord',
  'findRelatedCollection',
  'updateRecord',
  'deleteRecord',
]);

function isOperationWithPrimaryRecord(
  options: UrlOptions
): options is
  | FindRecordUrlOptions
  | FindRelatedCollectionUrlOptions
  | FindRelatedResourceUrlOptions
  | UpdateRecordUrlOptions
  | DeleteRecordUrlOptions {
  return 'op' in options && OPERATIONS_WITH_PRIMARY_RECORDS.has(options.op);
}

function hasResourcePath(options: UrlOptions): options is GenericUrlOptions {
  return 'resourcePath' in options && typeof options.resourcePath === 'string' && options.resourcePath.length > 0;
}

function resourcePathForType(options: UrlOptions): string {
  assert(
    `resourcePathForType: You must pass a valid op as part of options`,
    'op' in options && typeof options.op === 'string'
  );
  return options.op === 'findMany' ? options.identifiers[0].type : options.identifier.type;
}

/**
 * Builds a URL for a request based on the provided options.
 * Does not include support for building query params (see `buildQueryParams`)
 * so that it may be composed cleanly with other query-params strategies.
 *
 * Usage:
 *
 * ```ts
 * import { buildBaseURL } from '@warp-drive/utilities';
 *
 * const url = buildBaseURL({
 *   host: 'https://api.example.com',
 *   namespace: 'api/v1',
 *   resourcePath: 'emberDevelopers',
 *   op: 'query',
 *   identifier: { type: 'ember-developer' }
 * });
 *
 * // => 'https://api.example.com/api/v1/emberDevelopers'
 * ```
 *
 * On the surface this may seem like a lot of work to do something simple, but
 * it is designed to be composable with other utilities and interfaces that the
 * average product engineer will never need to see or use.
 *
 * A few notes:
 *
 * - `resourcePath` is optional, but if it is not provided, `identifier.type` will be used.
 * - `host` and `namespace` are optional, but if they are not provided, the values globally
 *    configured via `setBuildURLConfig` will be used.
 * - `op` is required and must be one of the following:
 *   - 'findRecord' 'query' 'findMany' 'findRelatedCollection' 'findRelatedRecord'` 'createRecord' 'updateRecord' 'deleteRecord'
 * - Depending on the value of `op`, `identifier` or `identifiers` will be required.
 *
 * @public
 */
export function buildBaseURL(urlOptions: UrlOptions): string {
  const options = Object.assign(
    {
      host: CONFIG.host,
      namespace: CONFIG.namespace,
    },
    urlOptions
  );
  assert(
    `buildBaseURL: You must pass \`op\` as part of options`,
    hasResourcePath(options) || (typeof options.op === 'string' && options.op.length > 0)
  );
  assert(
    `buildBaseURL: You must pass \`identifier\` as part of options`,
    hasResourcePath(options) ||
      options.op === 'findMany' ||
      (options.identifier && typeof options.identifier === 'object')
  );
  assert(
    `buildBaseURL: You must pass \`identifiers\` as part of options`,
    hasResourcePath(options) ||
      options.op !== 'findMany' ||
      (options.identifiers &&
        Array.isArray(options.identifiers) &&
        options.identifiers.length > 0 &&
        options.identifiers.every((i) => i && typeof i === 'object'))
  );
  assert(
    `buildBaseURL: You must pass valid \`identifier\` as part of options, expected 'id'`,
    hasResourcePath(options) ||
      !isOperationWithPrimaryRecord(options) ||
      (typeof options.identifier.id === 'string' && options.identifier.id.length > 0)
  );
  assert(
    `buildBaseURL: You must pass \`identifiers\` as part of options`,
    hasResourcePath(options) ||
      options.op !== 'findMany' ||
      options.identifiers.every((i) => typeof i.id === 'string' && i.id.length > 0)
  );
  assert(
    `buildBaseURL: You must pass valid \`identifier\` as part of options, expected 'type'`,
    hasResourcePath(options) ||
      options.op === 'findMany' ||
      (typeof options.identifier.type === 'string' && options.identifier.type.length > 0)
  );
  assert(
    `buildBaseURL: You must pass valid \`identifiers\` as part of options, expected 'type'`,
    hasResourcePath(options) ||
      options.op !== 'findMany' ||
      (typeof options.identifiers[0].type === 'string' && options.identifiers[0].type.length > 0)
  );

  // prettier-ignore
  const idPath: string =
      isOperationWithPrimaryRecord(options) ? encodeURIComponent(options.identifier.id)
      : '';
  const resourcePath = options.resourcePath || resourcePathForType(options);
  const { host, namespace } = options;
  const fieldPath = 'fieldPath' in options ? options.fieldPath : '';

  assert(
    `buildBaseURL: You tried to build a url for a ${String(
      'op' in options ? options.op + ' ' : ''
    )}request to ${resourcePath} but resourcePath must be set or op must be one of "${[
      'findRecord',
      'findRelatedRecord',
      'findRelatedCollection',
      'updateRecord',
      'deleteRecord',
      'createRecord',
      'query',
      'findMany',
    ].join('","')}".`,
    hasResourcePath(options) ||
      [
        'findRecord',
        'query',
        'findMany',
        'findRelatedCollection',
        'findRelatedRecord',
        'createRecord',
        'updateRecord',
        'deleteRecord',
      ].includes(options.op)
  );

  assert(`buildBaseURL: host must NOT end with '/', received '${host}'`, host === '/' || !host.endsWith('/'));
  assert(`buildBaseURL: namespace must NOT start with '/', received '${namespace}'`, !namespace.startsWith('/'));
  assert(`buildBaseURL: namespace must NOT end with '/', received '${namespace}'`, !namespace.endsWith('/'));
  assert(
    `buildBaseURL: resourcePath must NOT start with '/', received '${resourcePath}'`,
    !resourcePath.startsWith('/')
  );
  assert(`buildBaseURL: resourcePath must NOT end with '/', received '${resourcePath}'`, !resourcePath.endsWith('/'));
  assert(`buildBaseURL: fieldPath must NOT start with '/', received '${fieldPath}'`, !fieldPath.startsWith('/'));
  assert(`buildBaseURL: fieldPath must NOT end with '/', received '${fieldPath}'`, !fieldPath.endsWith('/'));
  assert(`buildBaseURL: idPath must NOT start with '/', received '${idPath}'`, !idPath.startsWith('/'));
  assert(`buildBaseURL: idPath must NOT end with '/', received '${idPath}'`, !idPath.endsWith('/'));

  const hasHost = host !== '' && host !== '/';
  const url = [hasHost ? host : '', namespace, resourcePath, idPath, fieldPath].filter(Boolean).join('/');
  return hasHost ? url : `/${url}`;
}

const DEFAULT_QUERY_PARAMS_SERIALIZATION_OPTIONS: QueryParamsSerializationOptions = {
  arrayFormat: 'comma',
};

function handleInclude(include: string | string[]): string[] {
  assert(
    `Expected include to be a string or array, got ${typeof include}`,
    typeof include === 'string' || Array.isArray(include)
  );
  return typeof include === 'string' ? include.split(',') : include;
}

/**
 * filter out keys of an object that have falsy values or point to empty arrays
 * returning a new object with only those keys that have truthy values / non-empty arrays
 *
 * @public
 * @param source object to filter keys with empty values from
 * @return A new object with the keys that contained empty values removed
 */
export function filterEmpty(source: Record<string, Serializable>): Record<string, Serializable> {
  const result: Record<string, Serializable> = {};
  for (const key in source) {
    const value = source[key];
    // Allow `0` and `false` but filter falsy values that indicate "empty"
    if (value !== undefined && value !== null && value !== '') {
      if (!Array.isArray(value) || value.length > 0) {
        result[key] = source[key];
      }
    }
  }
  return result;
}

/**
 * Sorts query params by both key and value returning a new URLSearchParams
 * object with the keys inserted in sorted order.
 *
 * Treats `included` specially, splicing it into an array if it is a string and sorting the array.
 *
 * Options:
 * - arrayFormat: 'bracket' | 'indices' | 'repeat' | 'comma'
 *
 * 'bracket': appends [] to the key for every value e.g. `&ids[]=1&ids[]=2`
 * 'indices': appends [i] to the key for every value e.g. `&ids[0]=1&ids[1]=2`
 * 'repeat': appends the key for every value e.g. `&ids=1&ids=2`
 * 'comma' (default): appends the key once with a comma separated list of values e.g. `&ids=1,2`
 *
 * @public
 * @return A {@link URLSearchParams} with keys inserted in sorted order
 */
export function sortQueryParams(params: QueryParamsSource, options?: QueryParamsSerializationOptions): URLSearchParams {
  const opts = Object.assign({}, DEFAULT_QUERY_PARAMS_SERIALIZATION_OPTIONS, options);
  const paramsIsObject = !(params instanceof URLSearchParams);
  const urlParams = new URLSearchParams();
  const dictionaryParams: Record<string, Serializable> = paramsIsObject ? params : {};

  if (!paramsIsObject) {
    params.forEach((value, key) => {
      const hasExisting = key in dictionaryParams;
      if (!hasExisting) {
        dictionaryParams[key] = value;
      } else {
        const existingValue = dictionaryParams[key];
        if (Array.isArray(existingValue)) {
          existingValue.push(value);
        } else {
          dictionaryParams[key] = [existingValue, value];
        }
      }
    });
  }

  if ('include' in dictionaryParams) {
    dictionaryParams.include = handleInclude(dictionaryParams.include as string | string[]);
  }

  const sortedKeys = Object.keys(dictionaryParams).sort();
  sortedKeys.forEach((key) => {
    const value = dictionaryParams[key];
    if (Array.isArray(value)) {
      value.sort();
      switch (opts.arrayFormat) {
        case 'indices':
          value.forEach((v, i) => {
            urlParams.append(`${key}[${i}]`, String(v));
          });
          return;
        case 'bracket':
          value.forEach((v) => {
            urlParams.append(`${key}[]`, String(v));
          });
          return;
        case 'repeat':
          value.forEach((v) => {
            urlParams.append(key, String(v));
          });
          return;
        case 'comma':
        default:
          urlParams.append(key, value.join(','));
          return;
      }
    } else {
      urlParams.append(key, String(value));
    }
  });

  return urlParams;
}

/**
 * Sorts query params by both key and value, returning a query params string
 *
 * Treats `included` specially, splicing it into an array if it is a string and sorting the array.
 *
 * Options:
 * - arrayFormat: 'bracket' | 'indices' | 'repeat' | 'comma'
 *
 * 'bracket': appends [] to the key for every value e.g. `ids[]=1&ids[]=2`
 * 'indices': appends [i] to the key for every value e.g. `ids[0]=1&ids[1]=2`
 * 'repeat': appends the key for every value e.g. `ids=1&ids=2`
 * 'comma' (default): appends the key once with a comma separated list of values e.g. `ids=1,2`
 *
 * @public
 * @return A sorted query params string without the leading `?`
 */
export function buildQueryParams(params: QueryParamsSource, options?: QueryParamsSerializationOptions): string {
  return sortQueryParams(params, options).toString();
}
