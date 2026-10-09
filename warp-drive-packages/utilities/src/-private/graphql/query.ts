import type { DocumentNode, OperationDefinitionNode } from 'graphql';

import type { ReactiveDataDocument, ReactiveDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { GraphqlQueryRequestOptions, GraphqlVariables } from '@warp-drive/core/types/graphql-request';
import type { TypedRecordInstance, TypeFromInstance } from '@warp-drive/core/types/record';
import type { ConstrainedRequestOptions } from '@warp-drive/core/types/request';

import { extractCacheOptions } from '../builder-utils';
import type { GraphqlRequestDetails, GraphqlUrlOptions } from './utilities';
import { buildBaseURL, buildCacheKey, buildGraphqlBody, GRAPHQL_DETAILS } from './utilities';

/**
 * A GraphQL query request, as returned by `get`. Besides what the request is made of, it carries the
 * {@link GraphqlRequestDetails} it was built from, which can be read with `getGraphqlRequestDetails`.
 */
export type GraphqlQueryRequest<RT = unknown> = GraphqlQueryRequestOptions<RT> & {
  [GRAPHQL_DETAILS]?: GraphqlRequestDetails;
};

export interface UseQueryResult<T> {
  value: Future<ReactiveDocument<T>>;
  refetch: () => void;
}

/**
 * Builds a GraphQL query request.
 *
 * The request gets a `cacheOptions.key` made from the url and the variables, so it can be cached
 * and reloaded like a `GET` request, and it carries the query and variables for the
 * `GraphQLToJSONAPIHandler`, readable with `getGraphqlRequestDetails`.
 *
 * ```ts
 * import { get } from '@warp-drive/utilities/graphql';
 *
 * const { content } = await store.request(get(GET_BUNDLES, 'bundle', { first: 10 }));
 * ```
 *
 * @summary Builds a GraphQL query request, keyed by its url and variables.
 * @public
 * @since 5.10.0
 * @param query - the parsed GraphQL query
 * @param type - the type of the resources the query returns
 * @param variables - the variables of the query
 * @param options - request options such as cache settings
 * @return the request, to pass to `store.request`
 */
export function get<T extends TypedRecordInstance>(
  query: DocumentNode,
  type: TypeFromInstance<T>,
  variables?: GraphqlVariables,
  options?: ConstrainedRequestOptions
): GraphqlQueryRequest<ReactiveDataDocument<T[]>>;
export function get(
  query: DocumentNode,
  type: string,
  variables: GraphqlVariables,
  options?: ConstrainedRequestOptions
): GraphqlQueryRequest;
export function get(
  query: DocumentNode,
  type: string,
  variables?: GraphqlVariables,
  options: ConstrainedRequestOptions = {}
): GraphqlQueryRequest {
  const cacheOptions = extractCacheOptions(options);
  const operationDefinition = query.definitions.find(
    (definition): definition is OperationDefinitionNode => definition.kind === 'OperationDefinition'
  );

  const urlOptions: GraphqlUrlOptions = {
    identifier: { type },
    operationName: operationDefinition?.name?.value ?? '',
    op: 'query',
  };

  if ('host' in options) {
    urlOptions.host = options.host;
  }
  if ('namespace' in options) {
    urlOptions.namespace = options.namespace;
  }

  const url = buildBaseURL(urlOptions);
  const resolvedVariables = variables ?? {};
  // POST requests have no default cache key, so derive one from the operation and its variables
  cacheOptions.key = buildCacheKey(url, resolvedVariables);
  const headers = new Headers();
  headers.append('Accept', 'application/vnd.api+json');

  return {
    url,
    method: 'POST',
    headers,
    body: JSON.stringify(buildGraphqlBody(urlOptions.operationName, query, resolvedVariables)),
    cacheOptions,
    op: 'query',
    [GRAPHQL_DETAILS]: {
      document: query,
      operationName: urlOptions.operationName,
      variables: resolvedVariables,
    },
  };
}
