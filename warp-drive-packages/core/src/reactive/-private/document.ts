import { assert } from '@warp-drive/core/build-config/macros';

import { withBrand } from '../../request.ts';
import { defineGate, notifyInternalSignal, peekInternalSignal, withSignalStore } from '../../signals/-private.ts';
import type { DocumentCacheOperation, UnsubscribeToken } from '../../store/-private/managers/notification-manager.ts';
import type { Store } from '../../store/-private/store-service.ts';
import type { ResourceKey } from '../../types.ts';
import type { RequestKey } from '../../types/identifier.ts';
import type { ImmutableRequestInfo, RequestInfo } from '../../types/request.ts';
import type { ResourceDocument } from '../../types/spec/document.ts';
import type { Link, Meta, PaginationLinks } from '../../types/spec/json-api-raw.ts';
import type { Mutable } from '../../types/utils.ts';
import { Destroy } from './symbols.ts';

function urlFromLink(link: Link): string {
  if (typeof link === 'string') return link;
  return link.href;
}

export interface ReactiveDocumentBase<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M> {
  /**
   * The links object for this document, if any
   *
   * e.g.
   *
   * ```ts
   * {
   *   self: '/articles?page[number]=3',
   * }
   * ```
   *
   * @public
   */
  readonly links?: PaginationLinks;

  /**
   * The RequestKey associated with this document, if any
   *
   * @public
   */
  readonly identifier: RequestKey | null;

  /**
   * Fetches the related link for this document, returning a promise that resolves
   * with the document when the request completes. If no related link is present,
   * will fallback to the self link if present
   *
   * @public
   */
  fetch(options?: RequestInfo<ReactiveDocument<T, M, E, EM>>): Promise<ReactiveDocument<T, M, E, EM>>;

  /**
   * Fetches the next link for this document, returning a promise that resolves
   * with the new document when the request completes, or null  if there is no
   * next link.
   *
   * @public
   */
  next(options?: RequestInfo<ReactiveDocument<T, M, E, EM>>): Promise<ReactiveDocument<T, M, E, EM> | null>;

  /**
   * Fetches the prev link for this document, returning a promise that resolves
   * with the new document when the request completes, or null if there is no
   * prev link.
   *
   * @public
   */
  prev(options: RequestInfo<ReactiveDocument<T, M, E, EM>>): Promise<ReactiveDocument<T, M, E, EM> | null>;

  /**
   * Fetches the first link for this document, returning a promise that resolves
   * with the new document when the request completes, or null if there is no
   * first link.
   *
   * @public
   */
  first(options: RequestInfo<ReactiveDocument<T, M, E, EM>>): Promise<ReactiveDocument<T, M, E, EM> | null>;

  /**
   * Fetches the last link for this document, returning a promise that resolves
   * with the new document when the request completes, or null if there is no
   * last link.
   *
   * @public
   */
  last(options: RequestInfo<ReactiveDocument<T, M, E, EM>>): Promise<ReactiveDocument<T, M, E, EM> | null>;

  /**
   * Implemented for `JSON.stringify` support.
   *
   * Returns the JSON representation of the document wrapper.
   *
   * This is a shallow serialization, it does not deeply serialize
   * the document's contents, leaving that to the individual record
   * instances to determine how to do, if at all.
   *
   * @public
   * @return
   */
  toJSON(): object;
}

/**
 * The variant of {@link ReactiveDocument} returned for a request whose
 * response contained no primary data, e.g. an error response.
 *
 * @public
 */
export interface ReactiveErrorDocument<
  T,
  EM extends Meta = Meta,
  E extends object = object,
  M extends Meta = EM,
> extends ReactiveDocumentBase<T, M, E, EM> {
  /**
   * The primary data for this document, if any.
   *
   * If this document has no primary data (e.g. because it is an error document)
   * this property will be `undefined`.
   *
   * For collections this will be an array of record instances,
   * for single resource requests it will be a single record instance or null.
   *
   * @public
   */
  readonly data?: undefined;

  /**
   * The meta object for this document, if any
   *
   * A failed request need not carry the same `meta` a successful one does, so
   * this document names its own meta as its second type param, just as
   * {@link ReactiveDataDocument} does. The fourth param is the *other* arm's
   * meta, needed only to type what `next`/`prev`/`fetch` resolve with, and it
   * defaults to this one — the right answer for an API that returns one
   * envelope either way.
   *
   * @public
   */
  readonly meta?: EM;

  /**
   * The errors returned by the API for this request, if any
   *
   * The cache stores whatever the API sent without validating it, so by
   * default this is `object` — no shape is promised. Requests that know what
   * their endpoint returns may narrow it by supplying the `E` type param.
   *
   * @public
   */
  readonly errors: E[];
}

/**
 * The variant of {@link ReactiveDocument} returned for a request whose
 * response contained primary data.
 *
 * @public
 */
export interface ReactiveDataDocument<
  T,
  M extends Meta = Meta,
  E extends object = object,
  EM extends Meta = M,
> extends ReactiveDocumentBase<T, M, E, EM> {
  /**
   * The primary data for this document, if any.
   *
   * If this document has no primary data (e.g. because it is an error document)
   * this property will be `undefined`.
   *
   * For collections this will be an array of record instances,
   * for single resource requests it will be a single record instance or null.
   *
   * @public
   */
  readonly data: T;

  /**
   * The meta object for this document, if any
   *
   * By default this is {@link Meta}, an arbitrary JSON object. Requests that
   * know the shape of the `meta` their endpoint returns may narrow it by
   * supplying the `M` type param, in which case reading a documented key
   * requires no cast or coercion.
   *
   * ```ts
   * type PageMeta = { page: { limit: number; offset: number }; total?: number };
   *
   * const { content } = await store.request(query<User, PageMeta>('user'));
   * content.meta?.total; // number | undefined, not unknown
   * ```
   *
   * @public
   */
  readonly meta?: M;

  /**
   * The errors returned by the API for this request, if any
   *
   * @public
   */
  readonly errors?: undefined;
}

interface PrivateReactiveDocument {
  /** @internal */
  _store: Store;

  /** @internal */
  _localCache: { document: ResourceDocument; request: ImmutableRequestInfo } | null;

  /** @internal */
  _subscription: UnsubscribeToken;

  _request<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocumentBase<T, M, E, EM>,
    link: keyof PaginationLinks,
    options?: RequestInfo<ReactiveDataDocument<T, M, E, EM>>
  ): Promise<ReactiveDataDocument<T, M, E, EM> | null>;
}
function upgradeThis(doc: unknown): asserts doc is PrivateReactiveDocument {}

/**
 * A Document is a class that wraps the response content from a request to the API
 * returned by `Cache.put` or `Cache.peek`, converting ResourceKeys into
 * ReactiveResource instances.
 *
 * It is not directly instantiated by the user, and its properties should not
 * be directly modified. Whether individual properties are mutable or not is
 * determined by the record instance itself.
 *
 * @public
 */
export type ReactiveDocument<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M> =
  | ReactiveDataDocument<T, M, E, EM>
  | ReactiveErrorDocument<T, EM, E, M>;

const ReactiveDocumentProto = {
  async _request<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocumentBase<T, M, E, EM>,
    link: keyof PaginationLinks,
    options: RequestInfo<ReactiveDocument<T, M, E, EM>> = withBrand<ReactiveDocument<T, M, E, EM>>({
      url: '',
      method: 'GET',
    })
  ): Promise<ReactiveDataDocument<T, M, E, EM> | null> {
    upgradeThis(this);
    const href = this.links?.[link];
    if (!href) {
      return null;
    }

    options.method = options.method || 'GET';
    Object.assign(options, { url: urlFromLink(href) });
    const response = await this._store.request<ReactiveDataDocument<T, M, E, EM>>(options);

    return response.content;
  },

  fetch<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>,
    options: RequestInfo<ReactiveDocument<T, M, E, EM>> = withBrand<ReactiveDataDocument<T, M, E, EM>>({
      url: '',
      method: 'GET',
    })
  ): Promise<ReactiveDataDocument<T, M, E, EM>> {
    upgradeThis(this);
    assert(`No self or related link`, this.links?.related || this.links?.self);
    options.cacheOptions = options.cacheOptions || {};
    options.cacheOptions.key = this.identifier?.lid;
    return this._request<T, M, E, EM>(
      this.links.related ? 'related' : 'self',
      options as RequestInfo<ReactiveDataDocument<T, M, E, EM>>
    ) as Promise<ReactiveDataDocument<T, M, E, EM>>;
  },

  next<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>,
    options?: RequestInfo<ReactiveDataDocument<T, M, E, EM>>
  ): Promise<ReactiveDataDocument<T, M, E, EM> | null> {
    upgradeThis(this);
    return this._request<T, M, E, EM>('next', options);
  },

  prev<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>,
    options: RequestInfo<ReactiveDataDocument<T, M, E, EM>>
  ): Promise<ReactiveDataDocument<T, M, E, EM> | null> {
    upgradeThis(this);
    return this._request<T, M, E, EM>('prev', options);
  },

  first<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>,
    options: RequestInfo<ReactiveDataDocument<T, M, E, EM>>
  ): Promise<ReactiveDataDocument<T, M, E, EM> | null> {
    upgradeThis(this);
    return this._request<T, M, E, EM>('first', options);
  },

  last<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>,
    options: RequestInfo<ReactiveDataDocument<T, M, E, EM>>
  ): Promise<ReactiveDataDocument<T, M, E, EM> | null> {
    upgradeThis(this);
    return this._request<T, M, E, EM>('last', options);
  },

  toJSON<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>
  ): object {
    upgradeThis(this);
    const data: Mutable<Partial<ReactiveDocument<T, M, E, EM>>> = {};
    data.identifier = this.identifier;
    if (this.data !== undefined) {
      data.data = this.data;
    }
    if (this.links !== undefined) {
      data.links = this.links;
    }
    if (this.errors !== undefined) {
      data.errors = this.errors;
    }
    if (this.meta !== undefined) {
      data.meta = this.meta;
    }
    return data;
  },

  [Destroy]<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
    this: ReactiveDocument<T, M, E, EM>
  ): void {
    upgradeThis(this);
    assert(`Cannot destroy a ReactiveDocument which has already been destroyed`, this._store);
    if (this._subscription) {
      this._store.notifications.unsubscribe(this._subscription);
      // @ts-expect-error
      this._store = null;
      // @ts-expect-error
      this._subscription = null;
    }
  },
};

defineGate(ReactiveDocumentProto, 'errors', {
  get<T>(this: ReactiveDocument<T>): object[] | undefined {
    upgradeThis(this);
    const { identifier } = this;

    if (!identifier) {
      const { document } = this._localCache!;
      if ('errors' in document) {
        return document.errors;
      }
      return;
    }

    const doc = this._store.cache.peek(identifier);
    assert(`No cache data was found for the document '${identifier.lid}'`, doc);
    return 'errors' in doc ? doc.errors : undefined;
  },
});
defineGate(ReactiveDocumentProto, 'data', {
  get<T>(this: ReactiveDocument<T>) {
    upgradeThis(this);
    const { identifier, _localCache } = this;

    const doc = identifier ? this._store.cache.peek(identifier) : _localCache!.document;
    assert(`No cache data was found for the document '${identifier?.lid ?? '<uncached document>'}'`, doc);
    const data = 'data' in doc ? (doc.data as T | undefined) : undefined;

    if (Array.isArray(data)) {
      return identifier
        ? (this._store.recordArrayManager.getCollection({
            source: data.slice() as ResourceKey[],
            requestKey: identifier,
          }) as T)
        : (this._store.recordArrayManager.getCollection({
            source: data.slice() as ResourceKey[],
          }) as T);
    } else if (data) {
      return this._store.peekRecord(data as unknown as ResourceKey) as T;
    } else {
      return data;
    }
  },
});
defineGate(ReactiveDocumentProto, 'links', {
  get<T>(this: ReactiveDocument<T>) {
    upgradeThis(this);
    const { identifier } = this;

    if (!identifier) {
      return this._localCache!.document.links;
    }
    const data = this._store.cache.peek(identifier);
    assert(`No cache data was found for the document '${identifier.lid}'`, data);
    return data.links;
  },
});
defineGate(ReactiveDocumentProto, 'meta', {
  get<T>(this: ReactiveDocument<T>): Meta | undefined {
    upgradeThis(this);
    const { identifier } = this;

    if (!identifier) {
      return this._localCache!.document.meta;
    }
    const data = this._store.cache.peek(identifier);
    assert(`No cache data was found for the document '${identifier.lid}'`, data);
    return data.meta;
  },
});

export function createReactiveDocument<T, M extends Meta = Meta, E extends object = object, EM extends Meta = M>(
  store: Store,
  cacheKey: RequestKey | null,
  localCache: { document: ResourceDocument; request: ImmutableRequestInfo } | null
): ReactiveDocument<T, M, E, EM> {
  const doc = Object.create(ReactiveDocumentProto) as ReactiveDocument<T, M, E, EM> & PrivateReactiveDocument;
  doc._store = store;
  doc._localCache = localCache;
  // @ts-expect-error we are initializing it here
  doc.identifier = cacheKey;
  const signals = withSignalStore(doc);

  // TODO if we ever enable auto-cleanup of the cache, we will need to tear this down
  // in a destroy method
  if (cacheKey) {
    doc._subscription = store.notifications.subscribe(cacheKey, (_key: RequestKey, type: DocumentCacheOperation) => {
      switch (type) {
        case 'updated':
          // FIXME in the case of a collection we need to notify it's length
          // and have it recalc
          notifyInternalSignal(peekInternalSignal(signals, 'data'));
          notifyInternalSignal(peekInternalSignal(signals, 'links'));
          notifyInternalSignal(peekInternalSignal(signals, 'meta'));
          notifyInternalSignal(peekInternalSignal(signals, 'errors'));
          break;
        case 'added':
        case 'removed':
        case 'invalidated':
        case 'state':
          break;
      }
    });
  }

  return doc;
}
