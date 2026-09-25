import { DEBUG } from '@warp-drive/build-config/env';
import { assert } from '@warp-drive/build-config/macros';

import type { Store } from '../../../index.ts';
import { withBrand } from '../../../request.ts';
import { defineGate, notifyInternalSignal, peekInternalSignal, withSignalStore } from '../../../signals/-private.ts';
import { recordIdentifierFor } from '../../../store/-private.ts';
import type { NotificationChannel } from '../../../store/-private/managers/notification-manager.ts';
import type { ResourceRelationship } from '../../../types/cache/relationship.ts';
import type { ResourceKey } from '../../../types/identifier.ts';
import type { RequestInfo } from '../../../types/request.ts';
import type { ResourceField } from '../../../types/schema/fields.ts';
import type { Link, Links, Meta, PaginationLinks } from '../../../types/spec/json-api-raw.ts';
import { Context } from '../symbols.ts';

/**
 * The reactive document produced for a `resource` relationship field on a
 * {@link ReactiveResource}.
 *
 * ```ts
 * const user = store.peekRecord<User>('user', '1');
 *
 * user.bestFriend.data;  // User | null | undefined
 * user.bestFriend.links; // { related: '/users/1/best-friend' }
 * user.bestFriend.meta;  // { ... }
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
 * membership becomes stale while the relationship has unsaved changes. Use
 * {@link ReactiveRelationshipDocument.isDirty | isDirty} and
 * {@link ReactiveRelationshipDocument.remoteData | remoteData} to detect and
 * reason about that drift.
 *
 * `data` is `undefined` when the relationship payload did not include a
 * `data` member (e.g. a links-only payload for an async relationship);
 * `null` means the relationship is known to be empty. Use
 * {@link ReactiveRelationshipDocument.fetch | fetch} to load the related
 * data via the relationship's `related` link.
 *
 * When the owning resource is editable the relationship may be mutated
 * through `data`:
 *
 * ```ts
 * editableUser.bestFriend.data = otherUser; // or null
 * ```
 *
 * Assigning to the field itself (`user.bestFriend = x`) is never allowed.
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
   * membership against the remote one while the relationship is being
   * edited.
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
   * are stale while `isDirty` is `true`.
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
  field: ResourceField;
  editable: boolean;
}

interface PrivateRelationshipDocument extends ReactiveRelationshipDocument<unknown> {
  _store: Store;
  [Context]: RelationshipSource;
}

function upgradeThis(doc: unknown): asserts doc is PrivateRelationshipDocument {}

/**
 * `resource` relationships require every resource referenced in their `data`
 * to have been included in the payload that referenced it. Materializing a
 * member that was never loaded is therefore an error rather than an empty
 * record.
 *
 * @private
 */
export function assertRelatedIsLoaded(
  store: Store,
  resourceKey: ResourceKey,
  field: ResourceField,
  related: ResourceKey
): void {
  if (!store._instanceCache.recordIsLoaded(related)) {
    throw new Error(
      `Cannot materialize the ${field.kind} relationship ${resourceKey.type}.${field.name} on '${resourceKey.type}:${String(resourceKey.id)}': the related resource '${related.type}:${String(related.id)}' has no data in the cache. Every resource referenced in the data of a resource relationship must be included in the payload that references it.`
    );
  }
}

function getRelationship(source: RelationshipSource): ResourceRelationship {
  const { store, resourceKey, path, editable } = source;
  const key = path[path.length - 1];
  return (
    editable ? store.cache.getRelationship(resourceKey, key) : store.cache.getRemoteRelationship(resourceKey, key)
  ) as ResourceRelationship;
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
    const rel = store.cache.getRemoteRelationship(resourceKey, key) as ResourceRelationship;

    if (rel.data === undefined) {
      return undefined;
    }
    if (!rel.data) {
      return null;
    }
    assertRelatedIsLoaded(store, resourceKey, source.field, rel.data);
    const record: unknown = store.peekRecord(rel.data);
    return record;
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
    if (!rel.data) {
      return null;
    }
    assertRelatedIsLoaded(source.store, source.resourceKey, source.field, rel.data);
    const record: unknown = source.store.peekRecord(rel.data);
    return record;
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
export function createRelationshipDocument<T>(source: RelationshipSource): ReactiveRelationshipDocument<T> {
  const doc = Object.create(RelationshipDocumentProto) as PrivateRelationshipDocument;
  doc._store = source.store;
  doc[Context] = Object.assign({}, source);
  // @ts-expect-error we are initializing it here
  doc.identifier = null;
  withSignalStore(doc);
  return doc as unknown as ReactiveRelationshipDocument<T>;
}

/**
 * Marks a relationship document's reactive properties as stale so they
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

  notifyInternalSignal(peekInternalSignal(signals, 'data'));
  notifyInternalSignal(peekInternalSignal(signals, 'isDirty'));

  if (channel === 'local') {
    return;
  }

  notifyInternalSignal(peekInternalSignal(signals, 'links'));
  notifyInternalSignal(peekInternalSignal(signals, 'meta'));
  notifyInternalSignal(peekInternalSignal(signals, 'remoteData'));
}
