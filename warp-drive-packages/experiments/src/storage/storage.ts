import { assert } from '@warp-drive/core/build-config/macros';
import { defineSignal, makeInitializer } from '@warp-drive/core/signals/-leaked';

import { SignalMap } from './-private/reactive-map.ts';
import { CacheStorage, type CacheStorageEvent, DEFAULT_CACHE_ID } from './cache.ts';

export interface ReactiveStorageOptions {
  /**
   * If true, falls back to in-memory storage when the underlying
   * storage is unavailable (e.g., private browsing mode).
   */
  fallbackToMemory?: boolean;

  /**
   * If true, updates signal state even when writes fail due to quota.
   * The onQuotaExceeded callback will be invoked before retrying.
   */
  updateOnQuotaExceeded?: boolean;

  /**
   * Called when a write fails due to quota exceeded.
   * Return true to retry the write after freeing space.
   */
  onQuotaExceeded?: (key: string, value: string) => boolean | Promise<boolean>;
}

let localStorageInstance: ReactiveStorage | null = null;
let sessionStorageInstance: ReactiveStorage | null = null;
let localStorageOptions: ReactiveStorageOptions = {};
let sessionStorageOptions: ReactiveStorageOptions = {};

// This pattern enables us to have a singleton service-like
// instance that also functions as a global singleton that
// can be imported and used outside of Ember's DI system.
/**
 * Retrieves the singleton instance of the LocalStorage service.
 *
 * If the instance does not already exist, it is created.
 */
export function getLocalStorage(): ReactiveStorage {
  if (!localStorageInstance) {
    localStorageInstance = new ReactiveStorage(localStorage, localStorageOptions);
  }
  return localStorageInstance;
}

export function getSessionStorage(): ReactiveStorage {
  if (!sessionStorageInstance) {
    sessionStorageInstance = new ReactiveStorage(sessionStorage, sessionStorageOptions);
  }
  return sessionStorageInstance;
}

const CacheStorages = new Map<string, ReactiveStorage>();
export function getCacheStorage(namespace: string | null = null): ReactiveStorage {
  const key = namespace ?? DEFAULT_CACHE_ID;
  let cache = CacheStorages.get(key);
  if (!cache) {
    const storage = CacheStorage.expectCache(key);
    cache = new ReactiveStorage(storage);
    CacheStorages.set(key, cache);
  }
  return cache;
}

/**
 * Configure options for the localStorage singleton.
 * Must be called before getLocalStorage() is first invoked.
 */
export function configureLocalStorage(options: ReactiveStorageOptions): void {
  localStorageOptions = options;
}

/**
 * Configure options for the sessionStorage singleton.
 * Must be called before getSessionStorage() is first invoked.
 */
export function configureSessionStorage(options: ReactiveStorageOptions): void {
  sessionStorageOptions = options;
}

/**
 * Check if an error is a quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Most browsers
    if (error.name === 'QuotaExceededError') return true;
    // Firefox
    if (error.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true;
  }
  return false;
}

/**
 * Check if an error indicates storage is unavailable (private browsing, etc.)
 */
function isStorageUnavailableError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Safari private browsing, some security restrictions
    if (error.name === 'SecurityError') return true;
    // Some browsers throw this in private mode
    if (error.name === 'InvalidStateError') return true;
  }
  return false;
}

export type EffectStorageEvent = CacheStorageEvent | StorageEvent;

declare global {
  interface WindowEventMap {
    storage: CustomEvent<CacheStorageEvent> | StorageEvent;
  }
}

/**
 * A reactive wrapper around the Web Storage API (localStorage/sessionStorage)
 * that provides signal-based access to storage items and length.
 *
 * Will automatically update when storage events occur in other tabs/windows.
 */
class ReactiveStorage implements Storage {
  private _storage: Storage;
  private _options: ReactiveStorageOptions;
  private _memoryOnly = false;
  private _values: Record<string, string | null> = {};

  declare private _signals: SignalMap<string>;
  declare private _length: number;

  private _effects = new Map<string, (value: EffectStorageEvent) => void>();
  setEffect(key: string, fn: (value: EffectStorageEvent) => void): void {
    assert(`Can only set effect once for key: ${key}`, !this._effects.has(key));
    this._effects.set(key, fn);
  }

  constructor(storage: Storage, options: ReactiveStorageOptions = {}) {
    this._storage = storage;
    this._options = options;

    if (!(storage instanceof CacheStorage)) {
      // Test if storage is accessible
      try {
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        this._length = storage.length;
      } catch (error) {
        if (options.fallbackToMemory && isStorageUnavailableError(error)) {
          this._memoryOnly = true;
          this._length = 0;
        } else {
          throw error;
        }
      }
    }

    // bind to localStorage events to trigger reactivity
    if (!this._memoryOnly) {
      window.addEventListener('storage', (event: StorageEvent | CustomEvent<CacheStorageEvent>) => {
        const data = 'detail' in event ? event.detail : event;

        // Only react to changes in the same storage area
        if (data.storageArea === storage) {
          this._values[data.key as string] = data.newValue;
          this._signals.notify(data.key as string);
          this._length = this._storage.length;
          const effect = this._effects.get(data.key as string);
          if (effect) {
            effect(data);
          }
        }
      });
    }
  }

  /**
   * Reactive access to the number of keys in Storage
   */
  get length(): number {
    return this._length;
  }

  /**
   * Non-reactive way to peek the current value of a key in Storage
   */
  peekItem(key: string): string | null {
    assert('ReactiveStorage.peekItem: key must be a string', typeof key === 'string');
    const keyStr = String(key);

    if (this._memoryOnly) {
      return this._values[keyStr] ?? null;
    }

    const value = this._values[keyStr];
    if (value !== undefined) {
      return value;
    }

    // Not yet loaded, fetch from storage, but don't track access
    const item = this._storage.getItem(keyStr);
    // this._values[keyStr] = item;
    return item;
  }

  /**
   * Reactive access to Storage contents
   */
  getItem(key: string): string | null {
    assert('ReactiveStorage.getItem: key must be a string', typeof key === 'string');
    const keyStr = String(key);

    if (this._memoryOnly) {
      this._signals.subscribe(keyStr);
      return this._values[keyStr] ?? null;
    }

    const value = this._values[keyStr];
    if (value !== undefined) {
      this._signals.subscribe(keyStr);
      return value;
    }

    // Not yet loaded, fetch from storage
    const item = this._storage.getItem(keyStr);
    this._values[keyStr] = item;
    this._signals.subscribe(keyStr);
    return item;
  }

  /**
   * Set a value in Storage, triggering reactivity
   */
  setItem(key: string, value: string): void {
    assert('ReactiveStorage.setItem: key must be a string', typeof key === 'string');
    assert('ReactiveStorage.setItem: value must be a string', typeof value === 'string');

    // Coerce to strings to match Storage API behavior
    const keyStr = String(key);
    const valueStr = String(value);
    const current = this._values[keyStr];
    if (current === valueStr) {
      // No change
      return;
    }

    // console.trace(`set field ${key} => ${String(value)}`);

    if (this._memoryOnly) {
      const currentValue = this._values[keyStr];
      if (currentValue === null || currentValue === undefined) {
        this._length += 1;
      }
      this._values[keyStr] = valueStr;
      this._signals.notify(keyStr);
      return;
    }

    try {
      this._storage.setItem(keyStr, valueStr);
      this._values[keyStr] = valueStr;
      this._signals.notify(keyStr);
      this._length = this._storage.length;
    } catch (error) {
      if (isQuotaExceededError(error)) {
        if (this._options.updateOnQuotaExceeded) {
          // Update signal state even though write failed
          this._values[keyStr] = valueStr;
          this._signals.notify(keyStr);
        }

        if (this._options.onQuotaExceeded) {
          const result = this._options.onQuotaExceeded(keyStr, valueStr);
          const retry = result instanceof Promise ? false : result;

          if (retry) {
            // Retry the write after callback freed space
            this._storage.setItem(keyStr, valueStr);
            this._length = this._storage.length;
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Remove a value from Storage, triggering reactivity
   */
  removeItem(key: string): void {
    assert('ReactiveStorage.removeItem: key must be a string', typeof key === 'string');
    const keyStr = String(key);

    if (this._memoryOnly) {
      const value = this._values[keyStr];
      if (value !== null && value !== undefined) {
        this._length -= 1;
      }
      this._values[keyStr] = null;
      return;
    }

    this._storage.removeItem(keyStr);
    this._values[keyStr] = null;
    this._signals.notify(keyStr);
    this._length = this._storage.length;
  }

  /**
   * Clears all keys from Storage, triggering reactivity
   */
  clear(): void {
    this._values = {};
    this._signals.clear();
    this._length = 0;

    if (this._memoryOnly) {
      return;
    }

    this._storage.clear();
  }

  /**
   * Reactive access to the key at the given index
   */
  key(index: number): string | null {
    assert('ReactiveStorage.key: index must be a number', typeof index === 'number');
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this._length; // track length access

    if (this._memoryOnly) {
      const keys = Object.keys(this._values).filter((k) => this._values[k] !== null);
      return keys[index] ?? null;
    }

    return this._storage.key(index);
  }
}
defineSignal(ReactiveStorage.prototype, '_length', 0);
defineSignal(
  ReactiveStorage.prototype,
  '_signals',
  makeInitializer(() => new SignalMap<string>())
);

export type { ReactiveStorage };
