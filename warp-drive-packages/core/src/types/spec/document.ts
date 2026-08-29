// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ReactiveDataDocument, ReactiveDocument, ReactiveErrorDocument } from '../../reactive.ts';
import type { PersistedResourceKey } from '../identifier.ts';
import type { ApiError } from './error.ts';
import type { Links, Meta, PaginationLinks } from './json-api-raw.ts';

/**
 * This type represents a raw {json:api} document for a meta-only
 * document returned by a request intended to be inserted into the cache.
 */
export interface ResourceMetaDocument {
  /**
   * the url or cache-key associated with the structured document
   */
  lid?: string;
  /**
   * meta information about the document
   */
  meta: Meta;
  /**
   * links related to the document
   */
  links?: Links | PaginationLinks;
}

/**
 * This type represents a raw {json:api} document for a single resource
 * returned by a request intended to be inserted into the cache.
 *
 * For the Reactive value returned by a request using the store, use {@link ReactiveDataDocument} instead.
 */
export interface SingleResourceDataDocument<T = PersistedResourceKey, R = PersistedResourceKey> {
  /**
   * the url or cache-key associated with the structured document
   */
  lid?: string;
  /**
   * links related to the document
   */
  links?: Links | PaginationLinks;
  /**
   * meta information about the document
   */
  meta?: Meta;
  /**
   * the resource the document represents, or `null` if it has none
   */
  data: T | null;
  /**
   * any additional resources included via sideloading
   */
  included?: R[];
}

/**
 * This type represents a raw {json:api} document for a resource collection
 * returned by a request intended to be inserted into the cache.
 *
 * For the Reactive value returned by a request using the store, use {@link ReactiveDataDocument} instead.
 */
export interface CollectionResourceDataDocument<T = PersistedResourceKey> {
  /**
   * the url or cache-key associated with the structured document
   */
  lid?: string;
  /**
   * links related to the document, including pagination links
   */
  links?: Links | PaginationLinks;
  /**
   * meta information about the document
   */
  meta?: Meta;
  /**
   * the resources the document represents
   */
  data: T[];
  /**
   * any additional resources included via sideloading
   */
  included?: T[];
}

/**
 * A type useful for representing the raw {json:api} documents that
 * the cache may use.
 *
 * See also:
 * - {@link SingleResourceDataDocument}
 * - {@link CollectionResourceDataDocument}
 *
 * For the Reactive value returned by a request using the store, use {@link ReactiveDataDocument} instead.
 */
export type ResourceDataDocument<T = PersistedResourceKey> =
  | SingleResourceDataDocument<T>
  | CollectionResourceDataDocument<T>;

/**
 * A type useful for representing the raw {json:api} Error documents that
 * the cache may use.
 *
 * For the Reactive value returned by a request using the store, use {@link ReactiveErrorDocument} instead.
 */
export interface ResourceErrorDocument {
  /**
   * the url or cache-key associated with the structured document
   */
  lid?: string;
  /**
   * links related to the document
   */
  links?: Links | PaginationLinks;
  /**
   * meta information about the document
   */
  meta?: Meta;
  /**
   * the errors the document represents
   */
  errors: ApiError[];
}

/**
 * A type useful for representing the raw {json:api} documents that
 * the cache may use.
 *
 * See also:
 * - {@link ResourceMetaDocument}
 * - {@link SingleResourceDataDocument}
 * - {@link CollectionResourceDataDocument}
 * - {@link ResourceErrorDocument}
 *
 * For the Reactive value returned by a request using the store, use {@link ReactiveDocument} instead.
 */
export type ResourceDocument<T = PersistedResourceKey> =
  | ResourceMetaDocument
  | SingleResourceDataDocument<T>
  | CollectionResourceDataDocument<T>
  | ResourceErrorDocument;
