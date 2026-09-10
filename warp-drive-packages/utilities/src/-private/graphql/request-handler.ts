import type { Handler, NextFn } from '@warp-drive/core/request';
import type { FetchError } from '@warp-drive/core/request/-private/utils';
import type { ArrayValue, ObjectValue, Value } from '@warp-drive/core/types/json/raw';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type {
  ExistingResourceIdentifierObject,
  ExistingResourceObject,
  JsonApiDocument,
  ResourceRelationshipsObject,
} from '@warp-drive/core/types/spec/json-api-raw';

import { singularize } from '../string/inflect.ts';

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
}

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
      const { options } = context.request;

      // If the response is not from a GraphQL API, skip transformation
      const responseFormat = response?.headers.get('x-response-format');
      if (responseFormat !== 'graphql' && !request.url?.includes('/graphql') && !request.url?.includes('/gql')) {
        return result;
      }

      const jsonApiDocument = this.transformGraphQLToJSONAPI(content as GraphQLResponse, options as GqlOptions);

      if (jsonApiDocument.errors && options?.errorPolicy === 'all') {
        const msg = `[${response?.status}] ${context.request.method ?? 'GET'} (${response?.type}) - ${response?.url}`;

        // @ts-expect-error - AggregateError is somehting we don't have in our TS version. This comment will be removed when this lands into WarpDrive package
        const error = new AggregateError(jsonApiDocument.errors, msg) as Error & {
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
      return { data: null };
    }

    const { data } = graphqlResponse;

    const keys = Object.keys(data);
    const key = keys[0];
    let value = data[key] as Value;
    const documentErrors = (value as ObjectValue).errors as unknown as GqlErrors[];

    if (documentErrors?.length > 0) {
      const formattedDocumentErrors = this.formatErrorResponse(documentErrors);
      if (options.errorPolicy === 'all') {
        return formattedDocumentErrors;
      } else {
        meta.errors = formattedDocumentErrors.errors as unknown as ObjectValue;
      }
    }

    // If the response is a success object (e.g., QuerySuccessSuccess),
    // extract the actual schema from within it
    value = this.extractSchemaFromSuccessObject(value);
    const resource = this.transformObjectToResource(value, key, included, processedIds, meta);

    const payload: JsonApiDocument = { data: resource, included };

    if (Object.keys(meta).length > 0) {
      payload.meta = meta;
    }

    return payload;
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

      const type = singularize(this.options.typeMapper(data.__typename as string) ?? this.options.typeMapper(typeName));

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

        if (this.parseAsRelationship(value)) {
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
