import { DEBUG } from '@warp-drive/build-config/env';
import { assert } from '@warp-drive/build-config/macros';

import type { Store } from '../../../index.ts';
import { withBrand } from '../../../request.ts';
import { defineGate, notifyInternalSignal, peekInternalSignal, withSignalStore } from '../../../signals/-private.ts';
import { createRelatedCollection, recordIdentifierFor } from '../../../store/-private.ts';
import type { NotificationChannel } from '../../../store/-private/managers/notification-manager.ts';
import type { ReactiveResourceArray } from '../../../store/-private/record-arrays/resource-array.ts';
import type { UpdateResourceRelationshipOperation } from '../../../types/cache/operations.ts';
import type { CollectionRelationship, Relationship, ResourceRelationship } from '../../../types/cache/relationship.ts';
import type { PersistedResourceKey, RequestKey, ResourceKey } from '../../../types/identifier.ts';
import type { RequestInfo } from '../../../types/request.ts';
import { EnableHydration } from '../../../types/request.ts';
import type { CollectionField, ResourceField } from '../../../types/schema/fields.ts';
import type { ResourceDocument } from '../../../types/spec/document.ts';
import type { Link, Links, Meta, PaginationLinks } from '../../../types/spec/json-api-raw.ts';
import { Context } from '../symbols.ts';
import { assertRelatedIsLoaded, RelatedCollectionManager } from './related-collection-manager.ts';

/**
 * The reactive document produced for a `resource` or `collection`
 * relationship field on a {@link ReactiveResource}.
 *
 * ```ts
 * const user = store.peekRecord<User>('user', '1');
 *
 * user.bestFriend.data;  // User | null | undefined
 * user.bestFriend.links; // { related: '/users/1/best-friend' }
 * user.bestFriend.meta;  // { ... }
 *
 * user.friends.data;     // User[] | undefined
 * ```
 *
 * `data` is a reactive view of the relationship's membership in the cache.
 * For an immutable (PolarisMode) resource it reflects the remote state; for
 * an editable resource (LegacyMode, or a resource that has been checked out
 * for editing) it reflects the local state, including unsaved changes.
 *
 * `links` and `meta` are server-owned and **always** reflect the last
 * payload received from the API, on editable and immutable resources alike.
 * They are never changed by local mutations, so `meta` derived from
 * membership (e.g. a `count`) becomes stale while the relationship has
 * unsaved changes.
 *
 * `data` is `undefined` when the relationship payload did not include a
 * `data` member (e.g. a links-only payload for an async relationship);
 * `null` (resource) or an empty array (collection) mean the relationship
 * is known to be empty. Use {@link ReactiveRelationshipDocument.fetch | fetch}
 * to load the relationship through its `related` link: the response updates
 * `data`, and the promise resolves with this same document.
 *
 * When the owning resource is editable the relationship may be mutated
 * through `data`:
 *
 * ```ts
 * editableUser.bestFriend.data = otherUser; // or null
 * editableUser.friends.data.push(otherUser);
 * editableUser.friends.data = [a, b];
 * ```
 *
 * Assigning to the field itself (`user.bestFriend = x`) is never allowed.
 *
 * Collection relationships are not paginated: pagination links present on
 * the relationship are surfaced on `links` but never merged into `data`.
 *
 * When serializing a relationship for a request, send only the identifiers
 * of `data`; `links` and `meta` describe the server's view and must not be
 * echoed back to it.
 *
 * @public
 */
export interface ReactiveRelationshipDocument<T> {
  /**
   * The related resource(s). `undefined` when the relationship has not
   * received membership data.
   *
   * Assignable when the owning resource is editable.
   *
   * @public
   */
  data: T | undefined;

  /**
   * The links object for this relationship, if any.
   *
   * Server-owned: always reflects the last payload received from the API
   * and is never affected by local mutations.
   *
   * @public
   */
  readonly links?: Links | PaginationLinks;

  /**
   * The meta object for this relationship, if any.
   *
   * Server-owned: always reflects the last payload received from the API
   * and is never affected by local mutations. Values derived from membership
   * (such as a `count`) are stale while the relationship has unsaved changes.
   *
   * @public
   */
  readonly meta?: Meta;

  /**
   * The cache key of the request document for this relationship's `related`
   * link (or its `self` link when there is no `related` link), or `null` when
   * the relationship has neither.
   *
   * It is the same key a top-level request for that URL is cached under, and
   * the key {@link ReactiveRelationshipDocument.fetch | fetch} caches its
   * response under. It updates when the relationship's links change.
   *
   * @public
   */
  readonly identifier: RequestKey | null;

  /**
   * Requests this relationship's `related` link (falling back to its `self`
   * link) and resolves with this same document once the response has been
   * applied to it.
   *
   * The response's `data` becomes the relationship's remote membership, the
   * same as a payload for the parent resource that includes the relationship
   * would: immutable records show it, and editable records reconcile it with
   * any unsaved local changes. The relationship's `links` and `meta` are kept;
   * the response's top-level `links` and `meta` describe the response, not
   * the relationship. Every resource the response references must be in it.
   *
   * ```ts
   * const friends = await user.friends.fetch();
   * friends === user.friends; // true
   * friends.data; // the members the API returned
   * ```
   *
   * The response is also cached as a request document under
   * {@link ReactiveRelationshipDocument.identifier | identifier}.
   *
   * @public
   */
  fetch(options?: RequestInfo): Promise<ReactiveRelationshipDocument<T>>;

  /**
   * Implemented for `JSON.stringify` support.
   *
   * This is a shallow serialization of the document's shape (`data`, `links`,
   * `meta`), not a request payload: when serializing the relationship for a
   * request, send only the identifiers of `data`.
   *
   * @public
   */
  toJSON(): object;
}

interface RelationshipSource {
  store: Store;
  resourceKey: ResourceKey;
  /**
   * The cache path to the field; the last segment is the field's cache key.
   */
  path: string[];
  field: ResourceField | CollectionField;
  editable: boolean;
  /**
   * The reactive array backing `data` for collection fields, created lazily
   * the first time membership data is available.
   */
  collection: ReactiveResourceArray | null;
}

interface PrivateRelationshipDocument extends ReactiveRelationshipDocument<unknown> {
  [Context]: RelationshipSource;
}

function upgradeThis(doc: unknown): asserts doc is PrivateRelationshipDocument {}

function getRelationship(source: RelationshipSource): ResourceRelationship | CollectionRelationship {
  const { store, resourceKey, path, editable } = source;
  const key = path[path.length - 1];
  return editable ? store.cache.getRelationship(resourceKey, key) : store.cache.getRemoteRelationship(resourceKey, key);
}

function urlFromLink(link: Link): string {
  if (typeof link === 'string') return link;
  return link.href;
}

const RelationshipDocumentProto = {
  async fetch(
    this: ReactiveRelationshipDocument<unknown>,
    options: RequestInfo = withBrand<unknown>({ url: '', method: 'GET' })
  ): Promise<ReactiveRelationshipDocument<unknown>> {
    upgradeThis(this);
    const { store, resourceKey, path, field } = this[Context];
    const key = path[path.length - 1];
    const { links } = store.cache.getRemoteRelationship(resourceKey, key);
    const href = links?.related || links?.self;
    assert(`Cannot fetch ${resourceKey.type}.${field.name} because the relationship has no related or self link`, href);
    options.method = options.method || 'GET';
    // the cache's own (non-reactive) document, so its `data` holds the resource keys
    // to apply to the relationship
    Object.assign(options, { url: urlFromLink(href), [EnableHydration]: false });

    const { content } = await store.request<ResourceDocument>(options);

    if (content && 'data' in content && content.data !== undefined) {
      const value = { data: content.data } as Relationship<PersistedResourceKey>;
      // the relationship keeps its own links: async relationships must always carry `related`
      if (links) {
        value.links = links;
      }
      const op: UpdateResourceRelationshipOperation = {
        op: 'update',
        record: resourceKey as PersistedResourceKey,
        field: key,
        value,
      };
      store.cache.patch(op);
    }

    return this;
  },

  toJSON(this: ReactiveRelationshipDocument<unknown>): object {
    const json: { identifier: RequestKey | null; data?: unknown; links?: Links | PaginationLinks; meta?: Meta } = {
      identifier: this.identifier,
    };
    if (this.data !== undefined) {
      json.data = this.data;
    }
    if (this.links !== undefined) {
      json.links = this.links;
    }
    if (this.meta !== undefined) {
      json.meta = this.meta;
    }
    return json;
  },
};

Object.defineProperty(RelationshipDocumentProto, 'identifier', {
  enumerable: true,
  configurable: true,
  get(this: ReactiveRelationshipDocument<unknown>): RequestKey | null {
    upgradeThis(this);
    const href = this.links?.related || this.links?.self;
    if (!href) {
      return null;
    }
    return this[Context].store.cacheKeyManager.getOrCreateDocumentIdentifier(
      withBrand<unknown>({ url: urlFromLink(href), method: 'GET' })
    );
  },
});

defineGate(RelationshipDocumentProto, 'links', {
  get(this: ReactiveRelationshipDocument<unknown>) {
    upgradeThis(this);
    const rel = getRelationship(this[Context]);
    if (DEBUG) {
      return rel.links ? Object.freeze(Object.assign({}, rel.links)) : undefined;
    }
    return rel.links;
  },
});

defineGate(RelationshipDocumentProto, 'meta', {
  get(this: ReactiveRelationshipDocument<unknown>) {
    upgradeThis(this);
    const rel = getRelationship(this[Context]);
    if (DEBUG) {
      return rel.meta ? Object.freeze(Object.assign({}, rel.meta)) : undefined;
    }
    return rel.meta;
  },
});

defineGate(RelationshipDocumentProto, 'data', {
  get(this: ReactiveRelationshipDocument<unknown>) {
    upgradeThis(this);
    const source = this[Context];
    const rel = getRelationship(source);

    if (rel.data === undefined) {
      return undefined;
    }

    if (source.field.kind === 'resource') {
      if (!rel.data) {
        return null;
      }
      assertRelatedIsLoaded(source.store, source.resourceKey, source.field, rel.data as ResourceKey);
      const record: unknown = source.store.peekRecord(rel.data as ResourceKey);
      return record;
    }

    if (!source.collection) {
      const { store, resourceKey, path, editable } = source;
      const keys = (rel.data as ResourceKey[]).slice();
      for (let i = 0; i < keys.length; i++) {
        assertRelatedIsLoaded(store, resourceKey, source.field, keys[i]);
      }
      source.collection = createRelatedCollection({
        store,
        manager: new RelatedCollectionManager(store, resourceKey, source.field, path[path.length - 1], editable),
        source: keys,
        editable,
        extensions: null,
        options: { resourceKey, path, field: source.field },
      });
    }
    return source.collection;
  },
  set(this: ReactiveRelationshipDocument<unknown>, value: unknown) {
    upgradeThis(this);
    const source = this[Context];
    const { store, resourceKey, path, field } = source;
    const key = path[path.length - 1];

    if (!source.editable) {
      assert(
        `Cannot set data on the relationship document for ${resourceKey.type}.${field.name} because the resource is not editable. Checkout the resource for editing first.`
      );
      return;
    }

    if (field.kind === 'resource') {
      assert(
        `Expected a resource or null to be set as the data of ${resourceKey.type}.${field.name}`,
        value === null || (typeof value === 'object' && value !== null && isRecord(value))
      );
      store.cache.mutate({
        op: 'replaceRelatedRecord',
        record: resourceKey,
        field: key,
        value: value === null ? null : recordIdentifierFor(value),
      });
      return;
    }

    assert(
      `Expected an array of resources to be set as the data of ${resourceKey.type}.${field.name}`,
      Array.isArray(value)
    );
    const keys = value.map((record: unknown) => {
      assert(
        `Expected every element set as the data of ${resourceKey.type}.${field.name} to be a resource`,
        isRecord(record)
      );
      return recordIdentifierFor(record as object);
    });
    if (keys.length !== new Set(keys).size) {
      const duplicates = keys.filter((currentValue, currentIndex) => keys.indexOf(currentValue) !== currentIndex);
      throw new Error(
        `Cannot replace a collection relationship's state with a new state that contains duplicates. Found duplicates for the following records within the new state provided to \`<${
          resourceKey.type
        }:${resourceKey.id || resourceKey.lid}>.${field.name}\`\n\t- ${Array.from(new Set(duplicates))
          .map((r) => r.lid)
          .sort((a, b) => a.localeCompare(b))
          .join('\n\t- ')}`
      );
    }
    store.cache.mutate({
      op: 'replaceRelatedRecords',
      record: resourceKey,
      field: key,
      value: keys,
    });
    // local collection ops are flushed by the store on a schedule; make the
    // array re-sync immediately so reads following the set are consistent.
    if (source.collection) {
      notifyInternalSignal(source.collection[Context].signal);
    }
  },
});

function isRecord(value: unknown): boolean {
  try {
    recordIdentifierFor(value as object);
    return true;
  } catch {
    return false;
  }
}

/**
 * @private
 */
export function createRelationshipDocument<T>(
  source: Omit<RelationshipSource, 'collection'>
): ReactiveRelationshipDocument<T> {
  const doc = Object.create(RelationshipDocumentProto) as PrivateRelationshipDocument;
  doc[Context] = Object.assign({ collection: null }, source);
  withSignalStore(doc);
  return doc as unknown as ReactiveRelationshipDocument<T>;
}

/**
 * Marks a relationship document's reactive properties (and the array
 * backing a collection's `data`) as stale so they recompute from the
 * cache on next access.
 *
 * `channel` is the channel the relationship notification was tagged with.
 * A purely `'local'` change (a mutation) can only affect `data`; `links` and
 * `meta` are server-owned and are left alone so their identity is preserved
 * and consumers of them do not recompute. Unscoped or `'remote'`
 * notifications stale everything.
 *
 * @private
 */
export function notifyRelationshipDocument(
  doc: ReactiveRelationshipDocument<unknown>,
  channel?: NotificationChannel
): void {
  upgradeThis(doc);
  const signals = withSignalStore(doc);
  const source = doc[Context];

  notifyInternalSignal(peekInternalSignal(signals, 'data'));
  if (source.collection) {
    notifyInternalSignal(source.collection[Context].signal);
  }

  if (channel === 'local') {
    return;
  }

  notifyInternalSignal(peekInternalSignal(signals, 'links'));
  notifyInternalSignal(peekInternalSignal(signals, 'meta'));
}

/**
 * Tears down the array backing a collection relationship document, if one
 * was materialized.
 *
 * @private
 */
export function destroyRelationshipDocument(doc: ReactiveRelationshipDocument<unknown>): void {
  upgradeThis(doc);
  const { collection } = doc[Context];
  if (collection && !collection.isDestroyed) {
    collection.destroy(false);
  }
}
