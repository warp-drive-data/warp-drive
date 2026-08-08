import type { ArrayValue, ObjectValue } from '../json/raw.ts';

/**
 * Represents the `meta` member of a {json:api} document, resource,
 * relationship, or link: an object containing non-standard
 * meta-information.
 *
 * [{json:api} Spec](https://jsonapi.org/format/#document-meta)
 */
export type Meta = ObjectValue;

/**
 * The object form of a {@link Link}, allowing a link to carry
 * additional {@link Meta | meta} information alongside its `href`.
 *
 * [{json:api} Spec](https://jsonapi.org/format/#document-links)
 */
export type LinkObject = {
  /**
   * the URI-reference for the link
   */
  href: string;
  /**
   * meta information about the link
   */
  meta?: Meta;
};

/**
 * A link is either a plain URI-reference string or a {@link LinkObject}
 * carrying additional meta information.
 *
 * [{json:api} Spec](https://jsonapi.org/format/#document-links)
 *
 * @example
 * ```ts
 * const simple: Link = '/articles/1/comments';
 * const withMeta: Link = { href: '/articles/1/comments', meta: { count: 10 } };
 * ```
 */
export type Link = string | LinkObject;

/**
 * The `links` member of a {json:api} resource or document.
 *
 * [{json:api} Spec](https://jsonapi.org/format/#document-links)
 */
export interface Links {
  /**
   * a link for retrieving the related resource(s)
   */
  related?: Link | null;
  /**
   * a link for retrieving the resource or document itself
   */
  self?: Link | null;
}

/**
 * The `links` member of a {json:api} document that supports pagination.
 *
 * [{json:api} Spec](https://jsonapi.org/format/#fetching-pagination)
 */
export interface PaginationLinks extends Links {
  /**
   * a link to the first page of data
   */
  first?: Link | null;
  /**
   * a link to the last page of data
   */
  last?: Link | null;
  /**
   * a link to the previous page of data
   */
  prev?: Link | null;
  /**
   * a link to the next page of data
   */
  next?: Link | null;
}

/**
 * Serves as a reference to a `Resource` but does not contain
 * any data itself.
 *
 * Used to establish relationship linkages between `Resources` and
 * to address data that may not be available synchronously.
 *
 * [JSON:API Spec](https://jsonapi.org/format/#document-resource-identifier-objects)
 *
 * @private
 */
export interface ExistingResourceIdentifierObject<T extends string = string> {
  /**
   * the resource's persisted id
   */
  id: string;

  /**
   * the resource's type
   */
  type: T;

  /**
   * While not officially part of the `JSON:API` spec,
   * `ember-data` allows the use of `lid` as a local
   * identifier for a `Resource`.
   *
   * @recommended It is best to include the lid used when creating
   *   a new resource if this is the response to a new resource creation,
   *   also recommended if this resource type uses secondary indexes.
   *
   * Once a `ResourceIdentifierObject` has been seen by the cache, `lid`
   * should always be present. Only when inbound from the an `API` response
   * is `lid` considered optional.
   *
   * [Identifiers RFC](https://github.com/emberjs/rfcs/blob/main/text/0403-ember-data-identifiers.md#ember-data--identifiers)
   *
   */
  lid?: string;

  /**
   * While valid in the `JSON:API` spec,
   * `ember-data` ignores `meta` on `ResourceIdentifierObjects`
   *
   * @ignored this property goes un-utilized and will be lost
   * @private
   */
  meta?: Meta;
}

/**
 * Serves as a reference to a resource created on the client
 * but not yet persisted.
 *
 * @private
 */
export interface NewResourceIdentifierObject<T extends string = string> {
  /**
   * Resources newly created on the client _may_
   * not have an `id` available to them prior
   * to completion of their first successful `save`.
   *
   * `id` will be `null` in this case.
   *
   */
  id: string | null;

  /**
   * the resource's type
   */
  type: T;

  /**
   * Resources newly created on the client _will always_
   * have an `lid` assigned immediately and available.
   */
  lid: string;
}

/**
 * A minimal reference to a resource by its {@link ResourceIdentifier.lid | lid} alone.
 *
 * This is not part of the {json:api} spec, but is accepted by WarpDrive's
 * cache as a lightweight alternative to {@link ExistingResourceIdentifierObject}
 * once a resource's identity is already known to the cache.
 */
export interface ResourceIdentifier {
  /**
   * the local identifier WarpDrive has assigned to the resource
   */
  lid: string;
}

/**
 * A reference to a resource, in any of the forms WarpDrive's cache accepts.
 *
 * See also:
 * - {@link ResourceIdentifier}
 * - {@link ExistingResourceIdentifierObject}
 * - {@link NewResourceIdentifierObject}
 *
 * [{json:api} Spec](https://jsonapi.org/format/#document-resource-identifier-objects)
 */
export type ResourceIdentifierObject<T extends string = string> =
  | ResourceIdentifier
  | ExistingResourceIdentifierObject<T>
  | NewResourceIdentifierObject<T>;

// TODO disallow NewResource, make narrowable
export interface SingleResourceRelationship<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> {
  data?: T | null;
  meta?: Meta;
  links?: Links;
}

export interface CollectionResourceRelationship<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> {
  data?: T[];
  meta?: Meta;
  links?: PaginationLinks;
}

export type InnerRelationshipDocument<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> =
  | SingleResourceRelationship<T>
  | CollectionResourceRelationship<T>;

export type ResourceRelationshipsObject<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> = Record<
  string,
  InnerRelationshipDocument<T>
>;

/**
 * Contains the data for an existing resource in JSON:API format
 */
export interface ExistingResourceObject<T extends string = string> extends ExistingResourceIdentifierObject<T> {
  meta?: Meta;
  attributes?: ObjectValue;
  relationships?: ResourceRelationshipsObject<ExistingResourceIdentifierObject>;
  links?: Links;
}

export type NewResourceObject<T extends string = string> = NewResourceIdentifierObject<T> & {
  meta?: Meta;
  attributes?: ObjectValue;
  relationships?: ResourceRelationshipsObject;
  links?: Links;
};

export type ResourceObject<T extends string = string> = ExistingResourceObject<T> | NewResourceObject<T>;

type Document = {
  lid?: string;
  meta?: Meta;
  included?: ExistingResourceObject[];
  jsonapi?: ObjectValue;
  links?: Links | PaginationLinks;
  errors?: ArrayValue;
};

export type EmptyResourceDocument = Document & {
  data: null;
};

export type SingleResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>;
};

export type CollectionResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>[];
};

/**
 * A (RAW) JSON:API Formatted Document.
 *
 * These documents should follow the JSON:API spec but do not
 * have the same level of guarantees as their `spec` counterparts.
 *
 * @private
 */
export type JsonApiDocument<T extends string = string> =
  | EmptyResourceDocument
  | SingleResourceDocument<T>
  | CollectionResourceDocument<T>;
