import { assert } from '@warp-drive/core/build-config/macros';
import type { SignalStore } from '@warp-drive/core/signals/-leaked';
import {
  entangleSignal,
  getOrCreateInternalSignal,
  notifyInternalSignal,
  withSignalStore,
} from '@warp-drive/core/signals/-leaked';

/**
 * A reactive wrapper around the browser's Map API that provides
 * granular per-key reactivity via WarpDrive's signal system.
 */
export class SignalMap<K extends string> {
  private _map: Record<K, number> = {} as Record<K, number>;
  // Deliberately a plain field rather than a signal. `subscribe` runs inside a
  // consumer's read (`ReactiveStorage.getItem`), and dirtying a signal there
  // trips the backtracking-rerender assertion the moment anything has already
  // consumed it in the same computation — which is every `@field` read under
  // Ember's tracking. Nothing consumes `size` reactively today; if that ever
  // changes it needs a design that doesn't write during a read.
  private _size = 0;
  private _signals: SignalStore = withSignalStore(this._map);

  subscribe(key: K): boolean {
    assert(`ReactiveMap keys must be strings, got ${typeof key}`, typeof key === 'string');
    const existing = this._signals.has(key);
    entangleSignal(this._signals, this._map, key, undefined);
    if (!existing) {
      this._size += 1;
    }
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
