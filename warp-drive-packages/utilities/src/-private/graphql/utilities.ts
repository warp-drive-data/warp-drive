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
