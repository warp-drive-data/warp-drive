import type { ResourceKey } from '../identifier.ts';
import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CollectionResourceRelationship,
  Links,
  Meta,
  PaginationLinks,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SingleResourceRelationship,
} from '../spec/json-api-raw.ts';

/**
 * The stable-cache-key form of a `to-one` {@link SingleResourceRelationship | relationship}.
 *
 * Unlike {@link SingleResourceRelationship}, `data` is always in the
 * stable {@link ResourceKey} form rather than a raw resource identifier.
 *
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
 */
export type Relationship<T = ResourceKey> = ResourceRelationship<T> | CollectionRelationship<T>;
