import type { DocumentNode, OperationDefinitionNode } from 'graphql';

import { recordIdentifierFor } from '@warp-drive/core';
import { assert } from '@warp-drive/core/build-config/macros';
import type { GraphqlVariables } from '@warp-drive/core/types/graphql-request';
import type { PersistedResourceKey, ResourceKey } from '@warp-drive/core/types/identifier';
import type { ConstrainedRequestOptions } from '@warp-drive/core/types/request';

import type { GraphqlRequestDetails, GraphqlUrlOptions } from './utilities';
import { buildBaseURL, buildGraphqlBody, GRAPHQL_DETAILS } from './utilities';

export type GraphqlMutationOp = 'createRecord' | 'updateRecord' | 'deleteRecord';

/**
 * A GraphQL mutation request, as returned by `createRecord`, `updateRecord` and `deleteRecord`.
 * It tells the cache which record is being saved, through `op` and `records`, in the same way
 * the JSON:API builders do.
 */
export type GraphqlMutationRequest<Op extends GraphqlMutationOp = GraphqlMutationOp> = {
  url: string;
  method: 'POST';
  headers: Headers;
  body: string;
  op: Op;
  data: { record: ResourceKey };
  records: [ResourceKey];
  [GRAPHQL_DETAILS]?: GraphqlRequestDetails;
};

function isExisting(identifier: ResourceKey): identifier is PersistedResourceKey {
  return 'id' in identifier && identifier.id !== null && 'type' in identifier && identifier.type !== null;
}

function buildMutation<Op extends GraphqlMutationOp>(
  op: Op,
  record: unknown,
  mutation: DocumentNode,
  variables: GraphqlVariables,
  options: ConstrainedRequestOptions
): GraphqlMutationRequest<Op> {
  const identifier = recordIdentifierFor(record);
  assert(`Expected to be given a record instance`, identifier);
  assert(`Cannot save a record that does not have an associated type`, Boolean(identifier.type));
  if (op !== 'createRecord') {
    assert(
      `Cannot ${op === 'deleteRecord' ? 'delete' : 'update'} a record that does not have an id.`,
      isExisting(identifier)
    );
  }

  const operationDefinition = mutation.definitions.find(
    (definition): definition is OperationDefinitionNode => definition.kind === 'OperationDefinition'
  );
  assert(`Expected the document to have an operation`, operationDefinition);
  assert(`Expected the operation to be a mutation`, operationDefinition.operation === 'mutation');
  const operationName = operationDefinition.name?.value ?? '';

  const urlOptions: GraphqlUrlOptions = {
    identifier: { type: identifier.type },
    operationName,
    op: 'mutation',
  };

  if ('host' in options) {
    urlOptions.host = options.host;
  }
  if ('namespace' in options) {
    urlOptions.namespace = options.namespace;
  }

  const headers = new Headers();
  headers.append('Accept', 'application/vnd.api+json');

  return {
    url: buildBaseURL(urlOptions),
    method: 'POST',
    headers,
    body: JSON.stringify(buildGraphqlBody(operationName, mutation, variables)),
    op,
    data: { record: identifier },
    records: [identifier],
    [GRAPHQL_DETAILS]: { document: mutation, operationName, variables },
  };
}

/**
 * Builds the request that saves a new record with a GraphQL mutation.
 *
 * When the server confirms it, the cache commits the record, using the record the mutation returns
 * (for example `createBundle { ... on createBundleSuccess { bundle { id __typename } } }`).
 * When the mutation has errors, the request rejects and the commit is rejected.
 *
 * ```ts
 * import { createRecord } from '@warp-drive/utilities/graphql';
 *
 * const bundle = store.createRecord('bundle', { name: 'Upgrade' });
 * await store.request(createRecord(bundle, CREATE_BUNDLE, { input: { name: bundle.name } }));
 * ```
 *
 * @summary Builds a GraphQL mutation request that saves a new record.
 * @public
 * @since 5.10.0
 * @param record - the record being saved
 * @param mutation - the parsed GraphQL mutation
 * @param variables - the variables of the mutation
 * @param options - request options: `host` and `namespace`. The handler rejects a mutation with GraphQL errors by default; to change that, set `errorPolicy` on the `options` of the request
 * @return the request, to pass to `store.request`
 */
export function createRecord(
  record: unknown,
  mutation: DocumentNode,
  variables: GraphqlVariables = {},
  options: ConstrainedRequestOptions = {}
): GraphqlMutationRequest<'createRecord'> {
  return buildMutation('createRecord', record, mutation, variables, options);
}

/**
 * Builds the request that saves the changes of an existing record with a GraphQL mutation.
 * It behaves like {@link createRecord}.
 *
 * @summary Builds a GraphQL mutation request that saves the changes of a record.
 * @public
 * @since 5.10.0
 * @param record - the record being saved
 * @param mutation - the parsed GraphQL mutation
 * @param variables - the variables of the mutation
 * @param options - request options: `host` and `namespace`. The handler rejects a mutation with GraphQL errors by default; to change that, set `errorPolicy` on the `options` of the request
 * @return the request, to pass to `store.request`
 */
export function updateRecord(
  record: unknown,
  mutation: DocumentNode,
  variables: GraphqlVariables = {},
  options: ConstrainedRequestOptions = {}
): GraphqlMutationRequest<'updateRecord'> {
  return buildMutation('updateRecord', record, mutation, variables, options);
}

/**
 * Builds the request that deletes an existing record with a GraphQL mutation.
 *
 * What the mutation returns does not matter: a Boolean, an `{ id }` or a payload is not a record, so
 * it is kept in `meta` and the cache only commits the deletion. When the mutation has errors, the
 * request rejects and the deletion is rejected.
 *
 * ```ts
 * import { deleteRecord } from '@warp-drive/utilities/graphql';
 *
 * await store.request(deleteRecord(bundle, DELETE_BUNDLE, { id: bundle.id }));
 * ```
 *
 * @summary Builds a GraphQL mutation request that deletes a record.
 * @public
 * @since 5.10.0
 * @param record - the record being deleted
 * @param mutation - the parsed GraphQL mutation
 * @param variables - the variables of the mutation
 * @param options - request options: `host` and `namespace`. The handler rejects a mutation with GraphQL errors by default; to change that, set `errorPolicy` on the `options` of the request
 * @return the request, to pass to `store.request`
 */
export function deleteRecord(
  record: unknown,
  mutation: DocumentNode,
  variables: GraphqlVariables = {},
  options: ConstrainedRequestOptions = {}
): GraphqlMutationRequest<'deleteRecord'> {
  return buildMutation('deleteRecord', record, mutation, variables, options);
}
