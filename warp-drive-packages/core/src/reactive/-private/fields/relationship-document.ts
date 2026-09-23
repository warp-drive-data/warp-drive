import { DEBUG } from '@warp-drive/build-config/env';
import { assert } from '@warp-drive/build-config/macros';

import type { Store } from '../../../index.ts';
import { withBrand } from '../../../request.ts';
import { defineGate, notifyInternalSignal, peekInternalSignal, withSignalStore } from '../../../signals/-private.ts';
import { createRelatedCollection, recordIdentifierFor } from '../../../store/-private.ts';
import type { NotificationChannel } from '../../../store/-private/managers/notification-manager.ts';
import type { ReactiveResourceArray } from '../../../store/-private/record-arrays/resource-array.ts';
import type { CollectionRelationship, ResourceRelationship } from '../../../types/cache/relationship.ts';
import type { ResourceKey } from '../../../types/identifier.ts';
import type { RequestInfo } from '../../../types/request.ts';
import type { CollectionField, ResourceField } from '../../../types/schema/fields.ts';
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
 * unsaved changes. Use {@link ReactiveRelationshipDocument.isDirty | isDirty}
 * and {@link ReactiveRelationshipDocument.remoteData | remoteData} to
 * detect and reason about that drift.
 *
 * `data` is `undefined` when the relationship payload did not include a
 * `data` member (e.g. a links-only payload for an async relationship);
 * `null` (resource) or an empty array (collection) mean the relationship
 * is known to be empty. Use {@link ReactiveRelationshipDocument.fetch | fetch}
 * to load the related data via the relationship's `related` link.
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
   * The related resource(s) as last confirmed by the API, ignoring any
   * unsaved local changes. On an immutable resource this is the same as
   * `data`; on an editable resource it lets you compare the local
   * membership against the remote one (e.g. to render "3 of 100" from
   * `meta.count` honestly while the relationship is being edited).
   *
   * `undefined` when the relationship has not received membership data.
   *
   * @public
   */
  readonly remoteData: T | undefined;

  /**
   * Whether the relationship has local changes that have not yet been
   * confirmed by the API. When `true`, `links` and `meta` describe the
   * remote membership (`remoteData`), not the local one (`data`).
   *
   * @public
   */
  readonly isDirty: boolean;

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
   * (such as a `count`) are stale while `isDirty` is `true`.
   *
   * @public
   */
  readonly meta?: Meta;

  /**
   * Relationship documents are not request documents and so
   * have no RequestKey.
   *
   * @public
   */
  readonly identifier: null;

  /**
   * Fetches the related link for this relationship (falling back to the
   * self link), returning a promise that resolves with the response
   * document when the request completes.
   *
   * The response is a top-level document; it is not merged into the
   * relationship's membership.
   *
   * @public
   */
  fetch(options?: RequestInfo): Promise<unknown>;

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
  /**
   * The (read-only) reactive array backing `remoteData` for collection
   * fields on an editable resource, created lazily. Immutable resources
   * reuse `collection`, since their `data` already renders remote state.
   */
  remoteCollection: ReactiveResourceArray | null;
}

interface PrivateRelationshipDocument extends ReactiveRelationshipDocument<unknown> {
  _store: Store;
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
  fetch(
    this: ReactiveRelationshipDocument<unknown>,
    options: RequestInfo = withBrand<unknown>({ url: '', method: 'GET' })
  ): Promise<unknown> {
    upgradeThis(this);
    const { links } = this;
    const href = links?.related || links?.self;
    assert(
      `Cannot fetch ${this[Context].resourceKey.type}.${this[Context].field.name} because the relationship has no related or self link`,
      href
    );
    options.method = options.method || 'GET';
    Object.assign(options, { url: urlFromLink(href) });
    return this._store.request<unknown>(options).then((response) => response.content);
  },

  toJSON(this: ReactiveRelationshipDocument<unknown>): object {
    const json: { identifier: null; data?: unknown; links?: Links | PaginationLinks; meta?: Meta } = {
      identifier: null,
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

defineGate(RelationshipDocumentProto, 'remoteData', {
  get(this: ReactiveRelationshipDocument<unknown>) {
    upgradeThis(this);
    const source = this[Context];
    if (!source.editable) {
      // an immutable resource already renders remote state
      return this.data;
    }

    const { store, resourceKey, path } = source;
    const key = path[path.length - 1];
    const rel = store.cache.getRemoteRelationship(resourceKey, key);

    if (rel.data === undefined) {
      return undefined;
    }

    if (source.field.kind === 'resource') {
      if (!rel.data) {
        return null;
      }
      assertRelatedIsLoaded(store, resourceKey, source.field, rel.data as ResourceKey);
      const record: unknown = store.peekRecord(rel.data as ResourceKey);
      return record;
    }

    if (!source.remoteCollection) {
      const keys = (rel.data as ResourceKey[]).slice();
      for (let i = 0; i < keys.length; i++) {
        assertRelatedIsLoaded(store, resourceKey, source.field, keys[i]);
      }
      source.remoteCollection = createRelatedCollection({
        store,
        manager: new RelatedCollectionManager(store, resourceKey, source.field, key, false),
        source: keys,
        editable: false,
        extensions: null,
        options: { resourceKey, path, field: source.field },
      });
    }
    return source.remoteCollection;
  },
});

defineGate(RelationshipDocumentProto, 'isDirty', {
  get(this: ReactiveRelationshipDocument<unknown>): boolean {
    upgradeThis(this);
    const { store, resourceKey, path } = this[Context];
    return store.cache.changedRelationships(resourceKey).has(path[path.length - 1]);
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
  source: Omit<RelationshipSource, 'collection' | 'remoteCollection'>
): ReactiveRelationshipDocument<T> {
  const doc = Object.create(RelationshipDocumentProto) as PrivateRelationshipDocument;
  doc._store = source.store;
  doc[Context] = Object.assign({ collection: null, remoteCollection: null }, source);
  // @ts-expect-error we are initializing it here
  doc.identifier = null;
  withSignalStore(doc);
  return doc as unknown as ReactiveRelationshipDocument<T>;
}

/**
 * Marks a relationship document's reactive properties (and the arrays
 * backing a collection's `data` and `remoteData`) as stale so they
 * recompute from the cache on next access.
 *
 * `channel` is the channel the relationship notification was tagged with.
 * A purely `'local'` change (a mutation) can only affect `data` and
 * `isDirty`; `links`, `meta` and `remoteData` are server-owned and are left
 * alone so their identity is preserved and consumers of them do not
 * recompute. Unscoped or `'remote'` notifications stale everything.
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
  notifyInternalSignal(peekInternalSignal(signals, 'isDirty'));
  if (source.collection) {
    notifyInternalSignal(source.collection[Context].signal);
  }

  if (channel === 'local') {
    return;
  }

  notifyInternalSignal(peekInternalSignal(signals, 'links'));
  notifyInternalSignal(peekInternalSignal(signals, 'meta'));
  notifyInternalSignal(peekInternalSignal(signals, 'remoteData'));
  if (source.remoteCollection) {
    notifyInternalSignal(source.remoteCollection[Context].signal);
  }
}

/**
 * Tears down the array backing a collection relationship document, if one
 * was materialized.
 *
 * @private
 */
export function destroyRelationshipDocument(doc: ReactiveRelationshipDocument<unknown>): void {
  upgradeThis(doc);
  const { collection, remoteCollection } = doc[Context];
  if (collection && !collection.isDestroyed) {
    collection.destroy(false);
  }
  if (remoteCollection && !remoteCollection.isDestroyed) {
    remoteCollection.destroy(false);
  }
}
