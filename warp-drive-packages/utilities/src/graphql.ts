import { createRecord, deleteRecord, updateRecord } from './-private/graphql/mutation';
import { get } from './-private/graphql/query';
import { getGraphqlRequestDetails } from './-private/graphql/utilities';
export type { GraphqlMutationOp, GraphqlMutationRequest } from './-private/graphql/mutation';
export type { GraphqlQueryRequest } from './-private/graphql/query';
export type { GraphqlRequestDetails } from './-private/graphql/utilities';

export { createRecord, deleteRecord, get, getGraphqlRequestDetails, updateRecord };
