import { assert } from '@warp-drive/core/build-config/macros';
import type { SignalStore } from '@warp-drive/core/signals/-private';
import {
  defineSignal,
  entangleSignal,
  getOrCreateInternalSignal,
  notifyInternalSignal,
  withSignalStore,
} from '@warp-drive/core/signals/-private';

/**
 * A reactive wrapper around the browser's Map API that provides
 * granular per-key reactivity via WarpDrive's signal system.
 */
export class SignalMap<K extends string> {
  private _map: Record<K, number> = {} as Record<K, number>;
  // _size is signal-backed via defineSignal below
  declare private _size: number;
  private _signals: SignalStore = withSignalStore(this._map);

  subscribe(key: K): boolean {
    assert(`ReactiveMap keys must be strings, got ${typeof key}`, typeof key === 'string');
    const existing = this._signals.has(key);
    entangleSignal(this._signals, this._map, key, undefined);
    const size = this._size;
    this._size = existing ? size : size + 1;
    return existing;
  }

  notify(key: K): void {
    assert(`ReactiveMap keys must be strings, got ${typeof key}`, typeof key === 'string');
    const signal = getOrCreateInternalSignal(this._signals, this._map, key, 0);
    notifyInternalSignal(signal);
  }

  clear(): void {
    for (const value of this._signals.values()) {
      notifyInternalSignal(value);
    }
    this._size = 0;
  }

  get size(): number {
    return this._size;
  }
}
defineSignal(SignalMap.prototype, '_size', 0);
