import { fieldKey } from './-private/graphql/field-arguments';
import { addToField, readField, removeFromField } from './-private/graphql/fields';
import { createRecord, deleteRecord, updateRecord } from './-private/graphql/mutation';
import { get } from './-private/graphql/query';
import { addToQueries, removeFromQueries } from './-private/graphql/queries';
import { getGraphqlRequestDetails } from './-private/graphql/utilities';
export type { FieldListOptions } from './-private/graphql/fields';
export type { GraphqlMutationOp, GraphqlMutationRequest } from './-private/graphql/mutation';
export type { QueryListOptions } from './-private/graphql/queries';
export type { GraphqlQueryRequest } from './-private/graphql/query';
export type { GraphqlRequestDetails } from './-private/graphql/utilities';

export {
  addToField,
  addToQueries,
  createRecord,
  deleteRecord,
  fieldKey,
  get,
  getGraphqlRequestDetails,
  readField,
  removeFromField,
  removeFromQueries,
  updateRecord,
};
