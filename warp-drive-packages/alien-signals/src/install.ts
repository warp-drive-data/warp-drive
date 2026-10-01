/**
 * Importing this entry point configures ***Warp*Drive** to use a signals graph built on
 * [alien-signals](https://github.com/stackblitz/alien-signals) for reactivity: on import it calls
 * {@link setupSignals} with {@link buildSignalConfig}.
 *
 * Add the import to the top of your application. If you have tests which do not invoke your
 * app, add it to your test setup as well:
 *
 * ```ts
 * import '@warp-drive/alien-signals/install';
 * ```
 *
 * A library should do this only in its tests, not in its published code. To observe changes
 * from outside ***Warp*Drive**, use the `Watcher` from
 * [`@warp-drive/alien-signals/primitives`](/api/@warp-drive/alien-signals/primitives/).
 *
 * @summary Side-effect import that configures WarpDrive to use a signals graph built on alien-signals for reactivity.
 * @module
 */
import { type HooksOptions, setupSignals, type SignalHooks } from '@warp-drive/core/configure';

import { consumeSignal, createMemo, createSignal, notifySignal, readMemo, type SignalNode } from './primitives.ts';

/**
 * Builds the {@link SignalHooks} that back ***Warp*Drive**'s reactivity with the graph in
 * [`@warp-drive/alien-signals/primitives`](/api/@warp-drive/alien-signals/primitives/). Each
 * signal is a value-less `SignalNode`, so every notification counts as a change, and each memo is
 * a `MemoNode`. `willSyncFlushWatchers` always returns `false`, and there is no `waitFor` hook, so
 * requests are not wrapped for test waiters.
 *
 * Importing `@warp-drive/alien-signals/install` already passes this function to
 * {@link setupSignals}.
 *
 * @example
 * ```ts
 * // what importing '@warp-drive/alien-signals/install' does
 * import { setupSignals } from '@warp-drive/core/configure';
 * import { buildSignalConfig } from '@warp-drive/alien-signals/install';
 *
 * setupSignals(buildSignalConfig);
 * ```
 *
 * @param _options - the {@link HooksOptions} that `setupSignals` passes in; this implementation does not read them
 * @return the signal hooks backed by the alien-signals graph
 * @summary Builds the signal hooks that back WarpDrive reactivity with signals and memos built on alien-signals.
 * @since 5.10.0
 * @public
 */
export function buildSignalConfig(_options: HooksOptions): SignalHooks<SignalNode> {
  return {
    createSignal,
    consumeSignal,
    notifySignal,
    createMemo: <F>(obj: object, key: string | symbol, fn: () => F): (() => F) => {
      const memo = createMemo(obj, key, fn);
      return () => readMemo(memo);
    },
    willSyncFlushWatchers: () => false,
  };
}

setupSignals(buildSignalConfig);
