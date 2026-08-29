import type { Future, Handler } from '../request.ts';
import type { Fetch } from '../request/-private/fetch.ts';
import type { RequestManager } from '../request/-private/manager.ts';
import type { FetchError } from '../request/-private/utils.ts';
import type { RequestLoadingState } from '../signals/request-state.ts';
import type { Store } from '../store/-private.ts';
import { getOrSetGlobal, getOrSetUniversal } from './-private.ts';
import type { ResourceKey } from './identifier.ts';
import type { QueryParamsSerializationOptions } from './params.ts';
import type {
  Includes,
  TypeFromInstanceOrString,
} from './record.ts';
import type { ResourceIdentifierObject } from './spec/json-api-raw.ts';
import type { RequestSignature } from './symbols.ts';

/**
 * A {@link RequestInfo.cacheOptions | cacheOptions} flag which, when set,
 * signals that a request should never be handled by the cache-manager and
 * thus will never resolve from cache nor update the cache.
 */
export const SkipCache: '___(unique) Symbol(SkipCache)' = getOrSetUniversal('SkipCache', Symbol.for('wd:skip-cache'));
/**
 * A {@link RequestInfo} flag which, when set, signals to the store's
 * `instantiateRecord` hook that the resolved content should be hydrated
 * into reactive records rather than returned as raw data.
 */
export const EnableHydration: '___(unique) Symbol(EnableHydration)' = getOrSetUniversal(
  'EnableHydration',
  Symbol.for('wd:enable-hydration')
);
/**
 * @private
 */
export const IS_FUTURE: '___(unique) Symbol(IS_FUTURE)' = getOrSetGlobal('IS_FUTURE', Symbol('IS_FUTURE'));
/**
 * @private
 */
export const STRUCTURED: '___(unique) Symbol(DOC)' = getOrSetGlobal('DOC', Symbol('DOC'));

export type { FetchError };

/**
 * The HTTP methods WarpDrive's request layer supports.
 */
export type HTTPMethod =
  | 'QUERY'
  | 'GET'
  | 'OPTIONS'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'CONNECT'
  | 'TRACE';

/**
 * Use these options to adjust {@link CacheHandler} behavior for a request
 * via {@link RequestInfo.cacheOptions}.
 *
 */
export interface CacheOptions {
  /**
   * A key that uniquely identifies this request. If not present, the url wil be used
   * as the key for any GET request, while all other requests will not be cached.
   *
   */
  key?: string;
  /**
   * If true, the request will be made even if a cached response is present
   * and not expired.
   *
   */
  reload?: boolean;
  /**
   * If true, and a cached response is present and not expired, the request
   * will be made in the background and the cached response will be returned.
   *
   */
  backgroundReload?: boolean;
  /**
   * Useful for metadata around when to invalidate the cache. Typically used
   * by strategies that invalidate requests by resource type when a new resource
   * of that type has been created. See the CachePolicy implementation
   * provided by `@ember-data/request-utils` for an example.
   *
   * It is recommended to only use this for query/queryRecord requests where
   * new records created later would affect the results, though using it for
   * findRecord requests is also supported if desired where it may be useful
   * when a create may affect the result of a sideloaded relationship.
   *
   * Generally it is better to patch the cache directly for relationship updates
   * than to invalidate findRecord requests for one.
   *
   */
  // TODO: Ideally this would be T extends TypedRecordInstance ? ExtractSuggestedCacheTypes<T>[] : string[];
  // but that leads to `Type instantiation is excessively deep and possibly infinite.`
  // issues when `T` has many properties.
  types?: string[];

  /**
   * If true, the request will never be handled by the cache-manager and thus
   * will never resolve from cache nor update the cache.
   *
   * Generally this is only used for legacy request that manage resource cache
   * updates in a non-standard way via the LegacyNetworkHandler.
   *
   */
  [SkipCache]?: boolean;
}
/**
 * The request shape produced by the `findRecord` request builders, for
 * use with {@link Store.request}.
 */
export type FindRecordRequestOptions<RT = unknown, T = unknown> = {
  /**
   * the url to request
   */
  url: string;
  /**
   * the HTTP method to use
   */
  method: 'GET';
  /**
   * the headers to send with the request
   */
  headers: Headers;
  /**
   * see {@link CacheOptions}
   */
  cacheOptions?: CacheOptions;
  /**
   * the name of the request operation
   */
  op: 'findRecord';
  /**
   * the resource being requested
   */
  records: [ResourceIdentifierObject<TypeFromInstanceOrString<T>>];
  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;
};

/**
 * The request shape produced by the `query` request builders, for
 * use with {@link Store.request}.
 */
export type QueryRequestOptions<RT = unknown> = {
  /**
   * the url to request
   */
  url: string;
  /**
   * the HTTP method to use
   */
  method: 'GET';
  /**
   * the headers to send with the request
   */
  headers: Headers;
  /**
   * see {@link CacheOptions}
   */
  cacheOptions?: CacheOptions;
  /**
   * the name of the request operation
   */
  op: 'query';
  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;
};

/**
 * The request shape produced by the `postQuery` request builders, for
 * use with {@link Store.request}.
 */
export type PostQueryRequestOptions<RT = unknown> = {
  /**
   * the url to request
   */
  url: string;
  /**
   * the HTTP method to use
   */
  method: 'POST' | 'QUERY';
  /**
   * the headers to send with the request
   */
  headers: Headers;
  /**
   * the body to send with the request
   */
  body?: string | BodyInit | FormData;
  /**
   * see {@link CacheOptions}. A `key` is required since `POST`/`QUERY`
   * requests otherwise have no cache-safe way to derive one from the url.
   */
  cacheOptions: CacheOptions & {
    /**
     * a key that uniquely identifies this request
     */
    key: string;
  };
  /**
   * the name of the request operation
   */
  op: 'query';
  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;
};

/**
 * The request shape produced by the `deleteRecord` request builders, for
 * use with {@link Store.request}.
 */
export type DeleteRequestOptions<RT = unknown, T = unknown> = {
  /**
   * the url to request
   */
  url: string;
  /**
   * the HTTP method to use
   */
  method: 'DELETE';
  /**
   * the headers to send with the request
   */
  headers: Headers;
  /**
   * the name of the request operation
   */
  op: 'deleteRecord';
  /**
   * the body to send with the request
   */
  body?: string | BodyInit | FormData;
  /**
   * data for handlers to convert into the request body
   */
  data: {
    /**
     * the resource being deleted
     */
    record: ResourceKey<TypeFromInstanceOrString<T>>;
  };
  /**
   * the resource being deleted
   */
  records: [ResourceIdentifierObject<TypeFromInstanceOrString<T>>];
  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;
};

type ImmutableRequest<T> = Readonly<T> & {
  readonly headers: ImmutableHeaders;
  readonly records: [ResourceKey];
};

/**
 * The request shape produced by the `updateRecord` request builders, for
 * use with {@link Store.request}.
 */
export type UpdateRequestOptions<RT = unknown, T = unknown> = {
  /**
   * the url to request
   */
  url: string;
  /**
   * the HTTP method to use
   */
  method: 'PATCH' | 'PUT';
  /**
   * the headers to send with the request
   */
  headers: Headers;
  /**
   * the name of the request operation
   */
  op: 'updateRecord';
  /**
   * the body to send with the request
   */
  body?: string | BodyInit | FormData;
  /**
   * data for handlers to convert into the request body
   */
  data: {
    /**
     * the resource being updated
     */
    record: ResourceKey<TypeFromInstanceOrString<T>>;
  };
  /**
   * the resource being updated
   */
  records: [ResourceIdentifierObject<TypeFromInstanceOrString<T>>];
  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;
};

/**
 * The request shape produced by the `createRecord` request builders, for
 * use with {@link Store.request}.
 */
export type CreateRequestOptions<RT = unknown, T = unknown> = {
  /**
   * the url to request
   */
  url: string;
  /**
   * the HTTP method to use
   */
  method: 'POST';
  /**
   * the headers to send with the request
   */
  headers: Headers;
  /**
   * the name of the request operation
   */
  op: 'createRecord';
  /**
   * the body to send with the request
   */
  body?: string | BodyInit | FormData;
  /**
   * data for handlers to convert into the request body
   */
  data: {
    /**
     * the resource being created
     */
    record: ResourceKey<TypeFromInstanceOrString<T>>;
  };
  /**
   * the resource being created
   */
  records: [ResourceIdentifierObject<TypeFromInstanceOrString<T>>];
  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;
};

/**
 * The immutable, handler-facing form of {@link DeleteRequestOptions}.
 */
export type ImmutableDeleteRequestOptions = ImmutableRequest<DeleteRequestOptions>;
/**
 * The immutable, handler-facing form of {@link UpdateRequestOptions}.
 */
export type ImmutableUpdateRequestOptions = ImmutableRequest<UpdateRequestOptions>;
/**
 * The immutable, handler-facing form of {@link CreateRequestOptions}.
 */
export type ImmutableCreateRequestOptions = ImmutableRequest<CreateRequestOptions>;

/**
 * A minimal reference to a resource sufficient to build a URL for it,
 * as accepted by the request builders.
 */
export type RemotelyAccessibleIdentifier<T extends string = string> = {
  /**
   * the resource's persisted id
   */
  id: string;
  /**
   * the resource's type
   */
  type: T;
  /**
   * the local identifier WarpDrive has assigned to the resource, if known
   */
  lid?: string;
};

/**
 * Options accepted by the request builders for constraining how a
 * request's url is constructed and how the request interacts with the cache.
 */
export interface ConstrainedRequestOptions {
  /**
   * If true, the request will be made even if a cached response is present
   * and not expired.
   */
  reload?: boolean;
  /**
   * If true, and a cached response is present and not expired, the request
   * will be made in the background and the cached response will be returned.
   */
  backgroundReload?: boolean;
  /**
   * The host to use when constructing the request's url, overriding any
   * host configured via `setBuildURLConfig`.
   */
  host?: string;
  /**
   * The namespace to use when constructing the request's url, overriding
   * any namespace configured via `setBuildURLConfig`.
   */
  namespace?: string;
  /**
   * The resource path to use when constructing the request's url,
   * overriding the default of pluralizing the resource's type.
   */
  resourcePath?: string;
  /**
   * Options for how to serialize the request's query params, see {@link QueryParamsSerializationOptions}.
   */
  urlParamsSettings?: QueryParamsSerializationOptions;
}

/**
 * Options accepted by the `findRecord` request builders.
 */
export interface FindRecordOptions extends ConstrainedRequestOptions {
  /**
   * the relationship paths to sideload, see {@link Includes}
   */
  include?: string | string[];
}

/**
 * When a {@link Future} resolves, it returns an object
 * containing the original {@link RequestInfo | request},
 * the {@link Response | response} set by the handler chain (if any), and
 * the processed content.
 */
export interface StructuredDataDocument<T> {
  /**
   * @private
   */
  [STRUCTURED]?: true;
  /**
   * @see {@link ImmutableRequestInfo}
   */
  request: ImmutableRequestInfo;
  /**
   * the response set by the handler chain, if any
   */
  response: Response | ResponseInfo | null;
  /**
   * the processed content of the response
   */
  content: T;
}

/**
 * When a {@link Future} rejects, it throws either an {@link Error}
 * an {@link AggregateError} or a {@link DOMException} that maintains
 * the `{ request, response, content }` shape but is also an Error instance
 * itself.
 *
 * If using the error originates from the {@link Fetch | Fetch Handler}
 * the error will be a {@link FetchError}
 */
export interface StructuredErrorDocument<T = unknown> extends Error {
  /**
   * @private
   */
  [STRUCTURED]?: true;
  /**
   * @see {@link ImmutableRequestInfo}
   */
  request: ImmutableRequestInfo;
  /**
   * the response set by the handler chain, if any
   */
  response: Response | ResponseInfo | null;
  /**
   * the error that caused the request to fail
   */
  error: string | object;
  /**
   * the processed content of the response, if any was received before the failure
   */
  content?: T;
}

/**
 * A union of the resolve/reject data types for the {@link Future}
 * returned by {@link Store.request | request}
 *
 * See also the docs for:
 *
 * - {@link Future}
 * - {@link StructuredDataDocument} (resolved/successful requests)
 * - {@link StructuredErrorDocument} (rejected/failed requests)
 */
export type StructuredDocument<T> = StructuredDataDocument<T> | StructuredErrorDocument<T>;

/**
 * The {@link RequestInit} interface accepted by the native {@link fetch} API.
 *
 * WarpDrive provides our own typings due to incompleteness in the native typings.
 *
 * @privateRemarks
 * - [MDN Reference (fetch)](https://developer.mozilla.org/docs/Web/API/Window/fetch)
 * - [MDN Reference (RequestInit)](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
 * - [MDN Reference (Request)](https://developer.mozilla.org/docs/Web/API/Request)
 *
 */
interface NativeRequestInit {
  /** Returns the cache mode associated with request, which is a string indicating how the request will interact with the browser's cache when fetching.
   */
  cache?: RequestCache;
  /** Returns the credentials mode associated with request, which is a string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL.
   */
  credentials?: RequestCredentials;
  /** Returns the kind of resource requested by request, e.g., "document" or "script".
   */
  destination?: RequestDestination;
  /** Returns a Headers object consisting of the headers associated with request. Note that headers added in the network layer by the user agent will not be accounted for in this object, e.g., the "Host" header.
   */
  headers?: Headers;
  /** Returns request's subresource integrity metadata, which is a cryptographic hash of the resource being fetched. Its value consists of multiple hashes separated by whitespace. [SRI]
   */
  integrity?: string;
  /** Returns a boolean indicating whether or not request can outlive the global in which it was created.
   */
  keepalive?: boolean;
  /** Returns request's HTTP method, which is "GET" by default.
   */
  method?: HTTPMethod;
  /** Returns the mode associated with request, which is a string indicating whether the request will use CORS, or will be restricted to same-origin URLs.
   *
   * `no-cors` is not allowed for streaming request bodies.
   *
   */
  mode?: RequestMode;
  /**
   * provides an explicit priority hint for the request.
   */
  priority?: RequestPriority;
  /** Returns the redirect mode associated with request, which is a string indicating how redirects for the request will be handled during fetching. A request will follow redirects by default.
   */
  redirect?: RequestRedirect;
  /** Returns the referrer of request. Its value can be a same-origin URL if explicitly set in init, the empty string to indicate no referrer, and "about:client" when defaulting to the global's default. This is used during fetching to determine the value of the `Referer` header of the request being made.
   */
  referrer?: string;
  /** Returns the referrer policy associated with request. This is used during fetching to compute the value of the request's referrer.
   */
  referrerPolicy?: ReferrerPolicy;
  /** Returns the signal associated with request, which is an AbortSignal object indicating whether or not request has been aborted, and its abort event handler.
   */
  signal?: AbortSignal;
  /** Returns the URL of request as a string.
   */
  url?: string;
  /** Any body that you want to add to your request. Note that a GET or HEAD request may not have a body.
   */
  body?: BodyInit | null;

  /**
   * When sending a ReadableStream as the body of a request, 'half' must be
   * specified.
   *
   * [Half Duplex Further Reading](https://developer.chrome.com/docs/capabilities/web-apis/fetch-streaming-requests#half_duplex)
   *
   */
  duplex?: 'half';
}

/**
 * A read-only {@link Headers} instance, as passed to {@link Handler | Handlers}
 * via {@link ImmutableRequestInfo.headers}.
 */
export interface ImmutableHeaders extends Headers {
  /**
   * Returns a mutable clone of these headers, if supported by the implementation.
   */
  clone?(): Headers;
  /**
   * Returns the headers as an array of `[key, value]` pairs.
   */
  toJSON(): [string, string][];
}

/**
 * Extends JavaScript's native {@link fetch} {@link NativeRequestInit | RequestInit} with additional
 * properties specific to the {@link RequestManager | RequestManager's} capabilities.
 *
 * This interface is used to define the shape of a request that can be made via
 * either the {@link RequestManager.request} or {@link Store.request} methods.
 *
 * @privateRemarks
 * - [MDN Reference (fetch)](https://developer.mozilla.org/docs/Web/API/Window/fetch)
 * - [MDN Reference (RequestInit)](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
 * - [MDN Reference (Request)](https://developer.mozilla.org/docs/Web/API/Request)
 *
 * @public
 * @since 4.12
 */
export interface RequestInfo<RT = unknown> extends NativeRequestInit {
  /**
   * If provided, used instead of the AbortController auto-configured for each request by the RequestManager
   *
   */
  controller?: AbortController;

  /**
   * @see {@link CacheOptions}
   */
  cacheOptions?: CacheOptions;
  /**
   * The {@link Store} the request was made against, if made via
   * {@link Store.request} rather than directly against a {@link RequestManager}.
   *
   * A {@link Handler} can read this off of {@link RequestContext.request | context.request}
   * to reach store state (the cache, other services attached to a custom
   * store subclass, etc.) without needing any Ember DI/`setOwner` wiring at
   * handler-construction time. This works for a handler of any shape (a
   * function, plain object, or class) because the store is attached to each
   * request individually rather than to the handler itself.
   *
   * The trade-off is that this is only populated for requests issued via
   * {@link Store.request | store.request(...)}; a request issued directly
   * against a {@link RequestManager} will not have it set unless the caller
   * supplies it explicitly. Handlers that rely on it should treat it as
   * optional.
   *
   * @example
   * ```ts
   * const LoggingHandler = {
   *   request<T>(context: RequestContext, next: NextFn<T>) {
   *     const store = context.request.store;
   *     if (store) {
   *       console.log(`[${store.constructor.name}] ${context.request.url ?? ''}`);
   *     }
   *     return next(context.request);
   *   },
   * };
   * ```
   */
  store?: Store;

  /**
   * The name of the request operation, if any (e.g. `'findRecord'`, `'query'`).
   */
  op?: string;

  /**
   * The {@link ResourceKey | ResourceKeys} of the primary resources involved in the request
   * (if any). This may be used by handlers to perform transactional
   * operations on the store.
   *
   */
  records?: ResourceKey[];

  /**
   * If true, this request will not be tracked by test waiters.
   */
  disableTestWaiter?: boolean;
  /**
   * data that a handler should convert into
   * the query (GET) or body (POST).
   *
   * Note: It is recommended that builders set query params
   * and body directly in most scenarios.
   *
   */
  data?: Record<string, unknown>;
  /**
   * options specifically intended for {@link Handler | Handlers}
   * to utilize to process the request
   *
   */
  options?: Record<string, unknown>;

  /**
   * @private used only to carry the response type for type inference purposes
   */
  [RequestSignature]?: RT;

  /**
   * see {@link EnableHydration}
   */
  [EnableHydration]?: boolean;
}

/**
 * Immutable version of {@link RequestInfo}. This is what is passed to handlers.
 *
 */
export type ImmutableRequestInfo<RT = unknown> = Readonly<Omit<RequestInfo<RT>, 'controller'>> & {
  /**
   * see {@link CacheOptions}
   */
  readonly cacheOptions?: Readonly<CacheOptions>;
  /**
   * see {@link ImmutableHeaders}
   */
  readonly headers?: ImmutableHeaders;
  /**
   * see {@link RequestInfo.data}
   */
  readonly data?: Readonly<Record<string, unknown>>;
  /**
   * see {@link RequestInfo.options}
   */
  readonly options?: Readonly<Record<string, unknown>>;

  /** Whether the request body has been read.
   */
  readonly bodyUsed?: boolean;
};

/**
 * An immutable, JSON-serializable subset of the native {@link Response}
 * interface.
 */
export interface ResponseInfo {
  /**
   * see {@link ImmutableHeaders}
   */
  readonly headers: ImmutableHeaders; // to do, maybe not this?
  /**
   * whether the response's status code was in the 200-299 range
   */
  readonly ok: boolean;
  /**
   * whether the response is the result of a redirect
   */
  readonly redirected: boolean;
  /**
   * the response's HTTP status code
   */
  readonly status: number;
  /**
   * the status message associated with the response's status code
   */
  readonly statusText: string;
  /**
   * the type of the response, see [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/type)
   */
  readonly type: ResponseType;
  /**
   * the url of the response
   */
  readonly url: string;
}

/**
 * The object a {@link Handler} uses to fulfill a request: it provides a
 * readonly view of the {@link RequestContext.request | request} and methods
 * for supplying the {@link Future}'s stream and final response.
 */
export interface RequestContext {
  /**
   * @see {@link ImmutableRequestInfo}
   */
  request: ImmutableRequestInfo;
  /**
   * a unique id for this request
   */
  id: number;

  /**
   * Supplies the stream of the response's content, if available, enabling
   * consumers to monitor download progress via {@link RequestLoadingState}.
   */
  setStream(stream: ReadableStream | Promise<ReadableStream | null>): void;
  /**
   * Supplies the response for the request.
   */
  setResponse(response: Response | ResponseInfo | null): void;
}
