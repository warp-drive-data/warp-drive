/**
 * @module
 * @summary Types for the cache-side state of to-one and to-many relationships, with related resources referenced by
 * `ResourceKey`.
 */

import type { ResourceKey } from '../identifier.ts';
import type {
  // oxlint-disable-next-line no-unused-vars
  CollectionResourceRelationship,
  Links,
  Meta,
  PaginationLinks,
  // oxlint-disable-next-line no-unused-vars
  SingleResourceRelationship,
} from '../spec/json-api-raw.ts';

/**
 * The stable-cache-key form of a `to-one` {@link SingleResourceRelationship | relationship}.
 *
 * Unlike {@link SingleResourceRelationship}, `data` is always in the
 * stable {@link ResourceKey} form rather than a raw resource identifier.
 *
 * @summary Cache-side state of a to-one relationship, with `data` as a `ResourceKey` or `null` plus optional meta
 * and links.
 * @example
 * ```ts
 * const relationship: ResourceRelationship = { data: resourceKey };
 * ```
 */
export interface ResourceRelationship<T = ResourceKey> {
  /**
   * the related resource, or `null` if the relationship has no related resource
   */
  data?: T | null;
  /**
   * meta information about the relationship
   */
  meta?: Meta;
  /**
   * links related to the relationship
   */
  links?: Links;
}

/**
 * The stable-cache-key form of a `to-many` {@link CollectionResourceRelationship | relationship}.
 *
 * Unlike {@link CollectionResourceRelationship}, each entry in `data` is
 * always in the stable {@link ResourceKey} form rather than a raw resource
 * identifier.
 *
 * @summary Cache-side state of a to-many relationship, with `data` as an array of `ResourceKey`s plus optional
 * meta and pagination links.
 * @example
 * ```ts
 * const relationship: CollectionRelationship = { data: [resourceKey] };
 * ```
 */
export interface CollectionRelationship<T = ResourceKey> {
  /**
   * the related resources
   */
  data?: T[];
  /**
   * meta information about the relationship
   */
  meta?: Meta;
  /**
   * links related to the relationship, including pagination links
   */
  links?: PaginationLinks;
}

/**
 * The stable-cache-key form of a relationship, whether `to-one` or `to-many`.
 *
 * See also:
 * - {@link ResourceRelationship}
 * - {@link CollectionRelationship}
 *
 * @summary Cache-side state of a to-one or to-many relationship, with related resources as `ResourceKey`s, as
 * returned by `cache.getRelationship`.
 */
export type Relationship<T = ResourceKey> = ResourceRelationship<T> | CollectionRelationship<T>;
