import type { Handler, NextFn } from '@warp-drive/core/request';
import type { ArrayValue, ObjectValue, Value } from '@warp-drive/core/types/json/raw';
import type { FetchError, RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type {
  ExistingResourceIdentifierObject,
  ExistingResourceObject,
  JsonApiDocument,
  ResourceRelationshipsObject,
} from '@warp-drive/core/types/spec/json-api-raw';

import { singularize } from '../string/inflect.ts';
import { applyFieldArguments, isFieldKey } from './field-arguments';
import type { GraphqlRequestDetails } from './utilities';
import { recordQuery } from './queries';
import { getGraphqlRequestDetails } from './utilities';

/**
 * Configuration options for GraphQL to JSON:API transformation
 */
export interface GraphQLToJSONAPIOptions {
  /**
   * Custom type mapping function
   * @param graphqlType - The GraphQL type name
   * @returns The JSON:API type name
   */
  typeMapper?: (graphqlType: string) => string;
}

/**
 * GraphQL response structure
 */
interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: GqlErrors[];
  extensions?: Record<string, unknown>;
}

interface GqlErrors {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

interface GqlOptions {
  errorPolicy?: 'ignore' | 'all';
  /**
   * The `op` of the request, set for requests built with `createRecord`, `updateRecord` or `deleteRecord`
   */
  operation?: string;
  /**
   * What the request was built from, when it was built with `get` or a mutation builder
   */
  details?: GraphqlRequestDetails;
}

const MUTATION_OPS = new Set(['createRecord', 'updateRecord', 'deleteRecord']);

/**
 * A request handler that transforms GraphQL responses into JSON:API format.
 *
 * This handler intercepts responses from GraphQL APIs and converts them
 * to JSON:API format that WarpDrive can work with natively.
 *
 * @example
 * ```ts
 * import { RequestManager, Fetch } from '@warp-drive/core';
 * import { GraphQLToJSONAPIHandler } from '@warp-drive/utilities/handlers';
 *
 * const manager = new RequestManager()
 *   .use([
 *     new GraphQLToJSONAPIHandler({
 *       typeMapper: (type) => type.toLowerCase()
 *     }),
 *     Fetch
 *   ]);
 * ```
 */
export class GraphQLToJSONAPIHandler implements Handler {
  declare options: Required<GraphQLToJSONAPIOptions>;

  constructor(options: GraphQLToJSONAPIOptions = {}) {
    this.options = {
      typeMapper: options.typeMapper ?? this.defaultTypeMapper,
    };
  }

  request<T>(context: RequestContext, next: NextFn<T>): Promise<T | StructuredDataDocument<T>> {
    return next(context.request).then((result) => {
      const { content, response, request } = result;
      const { op } = context.request;
      const isMutation = typeof op === 'string' && MUTATION_OPS.has(op);
      // A mutation that has errors must reject, so the cache does not commit a save the server refused.
      // The app can still choose another policy with `options.errorPolicy`.
      const options: GqlOptions = {
        ...(context.request.options as GqlOptions | undefined),
        operation: op,
        details: getGraphqlRequestDetails(context.request),
      };
      options.errorPolicy ??= isMutation ? 'all' : undefined;

      // If the response is not from a GraphQL API, skip transformation
      const responseFormat = response?.headers.get('x-response-format');
      if (responseFormat !== 'graphql' && !request.url?.includes('/graphql') && !request.url?.includes('/gql')) {
        return result;
      }

      const jsonApiDocument = this.transformGraphQLToJSONAPI(content as GraphQLResponse, options);

      if (jsonApiDocument.errors && options?.errorPolicy === 'all') {
        const msg = `[${response?.status}] ${context.request.method ?? 'GET'} (${response?.type}) - ${response?.url}`;

        const error = new AggregateError(jsonApiDocument.errors, msg) as unknown as Error & {
          content: object | undefined;
        } & FetchError;

        error.status = response?.status ?? 400;
        error.statusText = 'Unknown Request Error';
        error.isRequestError = true;
        error.code = error.status;
        error.name = 'GQL Error';
        error.content = jsonApiDocument.errors;

        throw error;
      }

      // Remember the query, so the list it fetched can be updated later with `addToQueries` and `removeFromQueries`
      const store = (context.request as { store?: object }).store;
      const key = context.request.cacheOptions?.key;
      if (store && key && options.details && op === 'query') {
        recordQuery(store, options.details.operationName, key, options.details.variables);
      }

      return {
        ...result,
        content: jsonApiDocument as T,
      };
    });
  }

  /**
   * Default type mapper - converts GraphQL types to JSON:API types
   */
  private readonly defaultTypeMapper = (graphqlType: string): string => {
    return `${graphqlType
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')}s`;
  };

  /**
   * Transform GraphQL response to JSON:API format
   */
  private transformGraphQLToJSONAPI(graphqlResponse: GraphQLResponse, options: GqlOptions): JsonApiDocument {
    const included: ExistingResourceObject[] = [];
    const processedIds = new Set<string>();
    const meta: ObjectValue = {};

    if (graphqlResponse.errors) {
      const formattedErrors = this.formatErrorResponse(graphqlResponse.errors);

      if (options?.errorPolicy === 'ignore') {
        meta.errors = formattedErrors.errors as unknown as ObjectValue;
      } else {
        return formattedErrors;
      }
    }

    if (!graphqlResponse.data) {
      // with `errorPolicy: 'ignore'` the errors were collected into `meta`, and must not be lost
      return Object.keys(meta).length > 0 ? { data: null, meta } : { data: null };
    }

    // Fields asked for with arguments get a key that holds their arguments, so the values for
    // different arguments do not overwrite each other
    const data = options?.details
      ? applyFieldArguments(
          graphqlResponse.data,
          options.details.document,
          options.details.operationName,
          options.details.variables
        )
      : graphqlResponse.data;

    const keys = Object.keys(data);
    const key = keys[0];
    let value = data[key] as Value;
    const documentErrors = (value as ObjectValue | null)?.errors as unknown as GqlErrors[] | undefined;

    if (documentErrors && documentErrors.length > 0) {
      const formattedDocumentErrors = this.formatErrorResponse(documentErrors);
      if (options.errorPolicy === 'all') {
        return formattedDocumentErrors;
      } else {
        meta.errors = formattedDocumentErrors.errors as unknown as ObjectValue;
      }
    }

    // If the root field is an error member of a result union
    // (e.g. `... on Error { message }`), surface it as a GraphQL error
    // instead of silently resolving to `data: null`
    const unionError = this.extractUnionError(value);

    if (unionError) {
      const formattedUnionError = this.formatErrorResponse([unionError]);

      if (options?.errorPolicy === 'ignore') {
        meta.errors = formattedUnionError.errors as unknown as ObjectValue;
        return { data: null, meta };
      }

      return formattedUnionError;
    }

    // A delete does not return the record, so what the mutation returns (a Boolean, an `{ id }`, a payload)
    // is kept in `meta` instead of becoming a resource of an unknown type
    if (options?.operation === 'deleteRecord') {
      if (value !== null && value !== undefined) {
        meta[key] = value;
      }

      const deleted: JsonApiDocument = { data: null, included: [] };

      if (Object.keys(meta).length > 0) {
        deleted.meta = meta;
      }

      return deleted;
    }

    // If the response is a success object (e.g., QuerySuccessSuccess),
    // extract the actual schema from within it
    value = this.extractSchemaFromSuccessObject(value);
    const resource = this.transformObjectToResource(value, key, included, processedIds, meta);

    // A root value that is not a resource (for example a mutation that returns a Boolean, or an
    // object without `__typename`) is kept in `meta` under its field name, instead of being dropped
    if (resource === null && value !== null && value !== undefined) {
      meta[key] = value;
    }

    const payload: JsonApiDocument = { data: resource, included };

    if (Object.keys(meta).length > 0) {
      payload.meta = meta;
    }

    return payload;
  }

  /**
   * Detects the error member of a result union, e.g. a mutation declared as
   * `createBundle(...) { ... on createBundleSuccess { bundle { id } } ... on Error { message } }`.
   *
   * A root value is treated as a union error when it has a `__typename` that ends in 'Error', a
   * string `message`, and no `id`. A payload that only has a `message`, such as
   * `DeleteBundlePayload { message }`, is not an error. Resources always have an `id`, so they are
   * never mistaken for errors.
   *
   * @returns the error as a GraphQL error, or null if the value is not a union error
   */
  private extractUnionError(value: Value): GqlErrors | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    const { __typename: typename, message, id } = value as Record<string, unknown>;

    if (typeof typename !== 'string' || !typename.endsWith('Error')) {
      return null;
    }

    if (typeof message !== 'string' || (id !== undefined && id !== null)) {
      return null;
    }

    return { message };
  }

  /**
   * Extract the actual schema from a success object
   * For example, if the response is { __typename: 'QuerySuccessSuccess', schemaRecord: {...} },
   * this will extract the 'schemaRecord' object
   */
  private extractSchemaFromSuccessObject(value: Value): Value {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return value;
    }

    const typename = (value as Record<string, unknown>).__typename as string | undefined;

    // Check if this is a success object (ends with 'Success')
    if (typename && typename.endsWith('Success')) {
      // Find the first property that is an object with an id and __typename
      for (const [key, val] of Object.entries(value)) {
        if (key === '__typename') {
          continue;
        }

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          const obj = val as Record<string, unknown>;
          if (obj.id && obj.__typename) {
            return val;
          }
        }
      }
    }

    return value;
  }

  /**
   * Transform a GraphQL object to a JSON:API resource
   */
  private transformObjectToResource(
    data: Value | ArrayValue,
    typeName: string,
    included: ExistingResourceObject[],
    processedIds: Set<string>,
    meta: ObjectValue
  ): ExistingResourceObject | ExistingResourceObject[] | null {
    if (data === null) {
      return null;
    }

    if (Array.isArray(data)) {
      const resources = data
        .map((item: Value) => this.transformObjectToResource(item, typeName, included, processedIds, meta))
        .filter(Boolean) as ExistingResourceObject[];

      return resources;
    }

    if (typeof data === 'object') {
      if ('edges' in data && data.edges) {
        const resources = (data.edges as ArrayValue)
          .map((item: Value) => {
            if (item && typeof item === 'object' && 'node' in item && item.node) {
              return this.transformObjectToResource(item.node as Value, typeName, included, processedIds, meta);
            }
            return null;
          })
          .filter(Boolean) as ExistingResourceObject[];

        if (data.pageInfo) {
          meta[typeName] = { pageInfo: data.pageInfo };
        }

        return resources;
      }

      if (typeName in data) {
        data = data[typeName] as ObjectValue;
      }

      const id = data.id ?? data._id ?? data.uuid;

      if (!id || typeof id !== 'string') {
        return null;
      }

      // Without a `__typename` we cannot tell what the object is, so it is not turned into a resource
      if (typeof data.__typename !== 'string') {
        return null;
      }

      const type = singularize(this.options.typeMapper(data.__typename) ?? this.options.typeMapper(typeName));

      const resourceId = `${type}:${id}`;

      if (processedIds.has(resourceId)) {
        return { type, id };
      }

      const attributes: ObjectValue = {};
      const relationships: ResourceRelationshipsObject<ExistingResourceIdentifierObject> = {};

      for (const entry of Object.entries(data)) {
        const key = entry[0];
        const value = entry[1];

        if (key === 'id' || key === '_id' || key === 'uuid' || key === '__typename' || value === undefined) {
          continue;
        }

        if (isFieldKey(key)) {
          attributes[key] = this.transformFieldWithArguments(value, key, included, processedIds, meta);
        } else if (this.parseAsRelationship(value)) {
          const relatedResource = this.transformObjectToResource(value, key, included, processedIds, meta);

          if (relatedResource) {
            if (Array.isArray(relatedResource)) {
              relationships[key] = {
                links: {
                  related: `/${type}/${id}/${key}`,
                },
                data: relatedResource.map((item) => ({ type: item.type, id: item.id })),
              };

              included.push(...relatedResource);
            } else {
              relationships[key] = {
                links: {
                  related: `/${type}/${id}/${key}`,
                },
                data: { type: relatedResource.type, id: relatedResource.id },
              };

              included.push(relatedResource);
            }
          }
        } else if (key === 'type') {
          attributes[`${type}Type`] = value;
        } else {
          attributes[key] = value;
        }
      }

      return { type, id, attributes, relationships };
    }

    return null;
  }

  /**
   * A field that was asked for with arguments is not a relationship, because the schema cannot declare
   * a relationship for every combination of arguments. Its value is kept as an attribute, under the key
   * of the field and its arguments:
   *
   * - a list of resources is `{ $refs: [{ type, id }] }`
   * - a single resource is `{ $ref: { type, id } }`
   * - anything else is kept as the response had it
   *
   * The resources themselves are added to `included`. Use `readField` to read the value back.
   */
  private transformFieldWithArguments(
    value: Value,
    key: string,
    included: ExistingResourceObject[],
    processedIds: Set<string>,
    meta: ObjectValue
  ): Value {
    const isResource =
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as ObjectValue).__typename === 'string' &&
      typeof (value as ObjectValue).id === 'string';

    // an empty list is kept as an empty list of refs, so resources can be added to it later
    if (Array.isArray(value) && value.length === 0) {
      return { $refs: [] };
    }

    if (!this.isHasMany(value) && !isResource) {
      return value;
    }

    const related = this.transformObjectToResource(value, key, included, processedIds, meta);
    const resources = Array.isArray(related) ? related : related ? [related] : [];
    for (const resource of resources) {
      if ('attributes' in resource) {
        included.push(resource);
      }
    }
    const refs = resources.map(({ type, id }) => ({ type, id }));

    return (Array.isArray(related) ? { $refs: refs } : { $ref: refs[0] ?? null }) as unknown as Value;
  }

  formatErrorResponse(errors: GqlErrors[]): JsonApiDocument {
    return {
      data: null,
      errors: errors.map((error) => ({
        title: 'GraphQL Error',
        detail: error.message,
        source: error.path ? { pointer: `/${error.path.join('/')}` } : {},
      })) as JsonApiDocument['errors'],
    };
  }

  private parseAsRelationship(value: Value): boolean {
    return this.isHasMany(value);
  }

  private isHasMany(value: Value): boolean {
    if (Array.isArray(value)) {
      /**
       * If we run `every` agains an empty array, it will always return true.
       * we're assuming that an empty array is not a relationship.
       */
      return (
        value.length > 0 &&
        value.every((item) => {
          const typename = (item as ObjectValue | null | undefined)?.__typename;
          return typeof typename === 'string' && typename.length > 0;
        })
      );
    }

    const edges = (value as ObjectValue | null | undefined)?.edges;
    return typeof value === 'object' && value !== null && edges !== undefined && edges !== null;
  }
}
