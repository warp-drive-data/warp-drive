import type { DocumentNode } from 'graphql';
import { print } from 'graphql';

import { assert } from '@warp-drive/core/build-config/macros';
import { getOrSetGlobal } from '@warp-drive/core/types/-private';
import type { GraphqlRequestBody, GraphqlVariables } from '@warp-drive/core/types/graphql-request';

export interface GenericUrlOptions {
  operationName: string;
  host?: string;
  namespace?: string;
}

export type GraphqlUrlOptions = {
  operationName: string;
  host?: string;
  namespace?: string;
  identifier: { type: string };
  // TODO update query builder to support all GET operations as in a POST GQL request
  op: 'query' | 'mutation';
};

export interface BuildURLConfig {
  host: string | null;
  namespace: string | null;
}

const CONFIG: BuildURLConfig = getOrSetGlobal('CONFIG', {
  host: '',
  namespace: '',
});

/**
 * Builds a URL for a request based on the provided options.
 * Does not include support for building query params (see `buildQueryParams`)
 * so that it may be composed cleanly with other query-params strategies.
 *
 * Usage:
 *
 * ```ts
 * import { buildBaseURL } from '@ember-data/request-utils';
 *
 * const url = buildBaseURL({
 *   host: 'https://api.example.com',
 *   namespace: 'api/v1',
 *   operationName: 'emberDevelopers',
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
 * - `operationName` is mandatory, and will eventually come fromt the query information.
 * - `host` and `namespace` are optional, but if they are not provided, the values globally
 *    configured via `setBuildURLConfig` will be used.
 * - `op` is required and must be one of the following:
 *   - 'findRecord' 'query' 'findMany' 'findRelatedCollection' 'findRelatedRecord'` 'createRecord' 'updateRecord' 'deleteRecord'
 * - Depending on the value of `op`, `identifier` or `identifiers` will be required.
 *
 * @public
 */
export function buildBaseURL(urlOptions: GraphqlUrlOptions): string {
  const options = Object.assign(
    {
      host: CONFIG.host,
      namespace: CONFIG.namespace,
    },
    urlOptions
  );
  assert(
    `buildBaseURL: You must pass \`operationName\` as part of options`,
    hasOperationName(options) || (typeof urlOptions.operationName === 'string' && urlOptions.operationName.length > 0)
  );

  const { host, namespace, operationName } = options;

  assert(`buildBaseURL: host must NOT end with '/', received '${host}'`, host === '/' || !host.endsWith('/'));
  assert(`buildBaseURL: namespace must NOT start with '/', received '${namespace}'`, !namespace.startsWith('/'));
  assert(`buildBaseURL: namespace must NOT end with '/', received '${namespace}'`, !namespace.endsWith('/'));

  const hasHost = host !== '' && host !== '/';
  const url = [hasHost ? host : '', namespace, operationName].filter(Boolean).join('/');
  return hasHost ? url : `/${url}`;
}

function hasOperationName(options: GraphqlUrlOptions): options is GraphqlUrlOptions & { resourcePath: string } {
  return 'operationName' in options && typeof options.operationName === 'string' && options.operationName.length > 0;
}

export function buildGraphqlBody(
  operationName: string,
  query: DocumentNode,
  variables: GraphqlVariables
): GraphqlRequestBody {
  return {
    query: print(query),
    operationName,
    variables,
  };
}

/**
 * Serializes a value as JSON with the keys of every object sorted, so equal
 * values always produce the same string regardless of the order their keys
 * were written in.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(val).sort()) {
        sorted[key] = (val as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return val;
  });
}

/**
 * Builds the key a GraphQL query is cached under.
 *
 * GraphQL requests are POSTs, and the cache only derives a key by default for
 * GET requests, so without one the response would not be cached. The url holds
 * the operation, but not the variables, so the key adds them: the same
 * operation with different variables is a different document.
 */
export function buildCacheKey(url: string, variables: GraphqlVariables): string {
  return `${url}#${stableStringify(variables)}`;
}

/**
 * What a GraphQL request was built from. It is attached to the request, next to
 * the serialized `body`, so a handler can read the query and its variables when
 * the response comes back, without parsing the `body` again.
 */
export interface GraphqlRequestDetails {
  /**
   * The parsed query document.
   */
  document: DocumentNode;
  /**
   * The name of the operation.
   */
  operationName: string;
  /**
   * The variables the operation was called with.
   */
  variables: GraphqlVariables;
}

/**
 * The key the {@link GraphqlRequestDetails} are stored under on a request.
 *
 * It is a symbol rather than an entry of `options`, because a caller that sets its
 * own `options` on a request, such as `{ ...request, options: { errorPolicy: 'all' } }`,
 * replaces them, while a symbol key is copied along when the request is spread.
 * It is registered globally so every copy of the package shares the same key.
 */
export const GRAPHQL_DETAILS: unique symbol = Symbol.for('@warp-drive/graphql:request-details');

/**
 * Reads the {@link GraphqlRequestDetails} of a request built with `get`.
 * Returns `undefined` for a request that was not built with it.
 *
 * @summary Reads the query and variables a request was built from.
 * @public
 * @since 5.10.0
 * @param request - a request built with `get`
 * @return the details, or `undefined` for a request not built with `get`
 */
export function getGraphqlRequestDetails(request: object): GraphqlRequestDetails | undefined {
  return (request as { [GRAPHQL_DETAILS]?: GraphqlRequestDetails })[GRAPHQL_DETAILS];
}
