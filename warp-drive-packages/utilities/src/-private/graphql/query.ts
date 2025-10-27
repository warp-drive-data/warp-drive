import type { DocumentNode, OperationDefinitionNode } from 'graphql';

import type { ReactiveDataDocument, ReactiveDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { GraphqlQueryRequestOptions, GraphqlVariables } from '@warp-drive/core/types/graphql-request';
import type { TypedRecordInstance, TypeFromInstance } from '@warp-drive/core/types/record';
import type { ConstrainedRequestOptions } from '@warp-drive/core/types/request';

import { extractCacheOptions } from '../builder-utils';
import type { GraphqlUrlOptions } from './utilities';
import { buildBaseURL, buildGraphqlBody } from './utilities';

export interface UseQueryResult<T> {
  value: Future<ReactiveDocument<T>>;
  refetch: () => void;
}

export function get<T extends TypedRecordInstance>(
  query: DocumentNode,
  type: TypeFromInstance<T>,
  variables?: GraphqlVariables,
  options?: ConstrainedRequestOptions
): GraphqlQueryRequestOptions<ReactiveDataDocument<T[]>>;
export function get(
  query: DocumentNode,
  type: string,
  variables: GraphqlVariables,
  options?: ConstrainedRequestOptions
): GraphqlQueryRequestOptions;
export function get(
  query: DocumentNode,
  type: string,
  variables?: GraphqlVariables,
  options: ConstrainedRequestOptions = {}
): GraphqlQueryRequestOptions {
  const cacheOptions = extractCacheOptions(options);
  const operationDefinition = query.definitions?.[0] as OperationDefinitionNode;

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
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json');

  return {
    url,
    method: 'POST',
    headers,
    body: JSON.stringify(buildGraphqlBody(urlOptions.operationName, query, variables ?? {})),
    cacheOptions,
    op: 'query',
  };
}
