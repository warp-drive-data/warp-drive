import { assert } from '@warp-drive/core/build-config/macros';

export const DEFAULT_CACHE_ID = 'reactive-cache';
const CACHES = new Map<string, CacheStorage>();
const StorageEvents = new BroadcastChannel('reactive-cache-events');
const CACHE_URL = `${location.origin}/api/reactive-cache.json`;

export interface InternalCacheStorageEvent {
  storageArea: string;
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
}
export interface CacheStorageEvent {
  storageArea: CacheStorage;
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
}

/**
 * Emits a {@link StorageEvent} on the local context to
 * match the broadcast event.
 */
function emitStorageEvent(event: CacheStorageEvent): void {
  window.dispatchEvent(new CustomEvent('storage', { detail: event }));
}

/**
 * Updates the cache and re-emits the event on the local context as a StorageEvent
 * This is necessary to trigger the reactive updates in the current tab.
 */
function handleCacheEvent(event: MessageEvent<InternalCacheStorageEvent>): void {
  const { data } = event;

  const cache = CACHES.get(data.storageArea);
  // if we don't have an instance of the cache in this context
  // then we don't need to do anything since there are no reactive
  // subscribers to update
  if (!cache) {
    return;
  }

  // a StorageEvent with a key of null
  // is a signal that the entire cache should be cleared.
  if (data.key === null) {
    cache._data = new Map();
    emitStorageEvent({
      storageArea: cache,
      key: null,
      oldValue: null,
      newValue: null,
    });
    return;
  }

  if (data.newValue === null) {
    // remove the key from the cache
    cache._data.delete(data.key);
  } else {
    // update the cache with the new value
    cache._data.set(data.key, data.newValue);
  }

  // emit a StorageEvent to trigger reactive updates in this context
  emitStorageEvent({
    storageArea: cache,
    key: data.key,
    oldValue: data.oldValue,
    newValue: data.newValue,
  });
}

// subscribe to all storage events from other contexts to
// keep caches in sync
StorageEvents.addEventListener('message', handleCacheEvent);

/**
 * A reactive interface for json stored in the browser [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) API.
 *
 * This is a good option for larger data sets than can be efficiently stored in localStorage
 * but should not be used as a permanent DB or storage solution.
 */
export class CacheStorage implements Storage {
  #cache: Cache | null;
  #cacheId: string;
  #inititalization: Promise<CacheStorage>;
  _data: Map<string, string | null> = new Map();
  _nextUpdate: number | null = null;
  _bufferedEvents: InternalCacheStorageEvent[] = [];

  async #initialize() {
    const cache = await caches.open(this.#cacheId);
    this.#cache = cache;

    // Load all existing entries into memory
    this._data = await deserializeFromCache(cache);

    return this;
  }

  constructor(cacheId: string) {
    this.#cacheId = cacheId;
    this.#cache = null;
    this.#inititalization = this.#initialize();
  }

  get length(): number {
    return this._data.size;
  }

  #update(key: string | null, oldValue: string | null, newValue: string | null) {
    const cache = this.#cache;
    if (!cache) {
      throw new Error('Cache not initialized');
    }
    this._bufferedEvents.push({
      storageArea: this.#cacheId,
      key: key,
      oldValue: oldValue,
      newValue: newValue,
    });
    if (!this._nextUpdate) {
      this._nextUpdate = window.setTimeout(() => {
        const events = this._bufferedEvents;
        this._bufferedEvents = [];
        this._nextUpdate = null;
        void serializeToCache(cache, this._data);
        for (const event of events) {
          StorageEvents.postMessage(event);
        }
      }, 0);
    }
  }

  clear(): void {
    this._data = new Map();
    this.#update(null, null, null);
  }

  getItem(key: string): string | null {
    return this._data.get(key) ?? null;
  }

  key(index: number): string | null {
    assert('ReactiveStorage.key: index must be a number', typeof index === 'number');
    assert('ReactiveStorage.key: index must be a non-negative integer', index >= 0 && Number.isInteger(index));
    assert('ReactiveStorage.key: index must be less than the number of items in storage', index < this.length);

    let i = 0;
    for (const value of this._data.keys()) {
      if (i === index) {
        return value;
      }
      i++;
    }

    return null;
  }

  removeItem(key: string): void {
    if (this._data.has(key)) {
      const oldValue = this._data.get(key) ?? null;
      this._data.delete(key);
      this.#update(key, oldValue, null);
    }
  }

  setItem(key: string, value: string): void {
    assert('ReactiveStorage.setItem: key must be a string', typeof key === 'string');
    assert('ReactiveStorage.setItem: value must be a string', typeof value === 'string');
    const oldValue = this._data.get(key) ?? null;
    if (oldValue === value) {
      return;
    }
    this._data.set(key, value);
    this.#update(key, oldValue, value);
  }

  /**
   * Get the singleton CacheStorage instance.
   *
   */
  static get(cacheId: string = DEFAULT_CACHE_ID): Promise<CacheStorage> {
    let cache = CACHES.get(cacheId);
    if (!cache) {
      cache = new CacheStorage(cacheId);
      CACHES.set(cacheId, cache);
    }
    return cache.#inititalization;
  }

  static expectCache(cacheId: string = DEFAULT_CACHE_ID): CacheStorage {
    const cache = CACHES.get(cacheId);
    if (!cache) {
      throw new Error(`Cache with id ${cacheId} not found. Make sure to call CacheStorage.get(${cacheId}) first.`);
    }
    return cache;
  }

  /**
   * Returns the IDs of all {@link CacheStorage} instances that have been
   * opened in this context via {@link CacheStorage.get}.
   */
  static getAllCacheIds(): string[] {
    return Array.from(CACHES.keys());
  }
}

interface CacheFile {
  version: 1;
  data: Array<[string, string]>;
}

function serializeToCache(cache: Cache, data: Map<string, string | null>): Promise<void> {
  const entries = Array.from(data.entries());
  const blob = JSON.stringify({
    version: 1,
    data: entries,
  });
  const response = new Response(blob);
  return cache.put(CACHE_URL, response);
}

function deserializeFromCache(cache: Cache): Promise<Map<string, string | null>> {
  return cache.match(CACHE_URL).then((response) => {
    if (!response) {
      return new Map();
    }
    return response.json().then((json: CacheFile) => {
      if (json.version !== 1) {
        throw new Error(`Unsupported cache version: ${json.version as string}`);
      }
      return new Map(json.data);
    });
  });
}
