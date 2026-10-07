/**
 * Importing this entry point configures ***Warp*Drive** to use the
 * [TC39 Signals polyfill](https://github.com/proposal-signals/signal-polyfill) for reactivity:
 * on import it calls `registerSignals` with {@link buildSignalConfig}.
 *
 * If `@warp-drive/alien-signals/install` was imported first, each `Signal.State` is registered with
 * its signals graph, alongside any other framework's signals, and memos come from that graph.
 * Otherwise it configures the polyfill on its own with `setupSignals`.
 *
 * Add the import to the top of your application. If you have tests which do not invoke your
 * app, add it to your test setup as well:
 *
 * ```ts
 * import '@warp-drive/tc39-proposal-signals/install';
 * ```
 *
 * A library should do this only in its tests, not in its published code. See
 * [Installation](/guides/installation/#tc39-signals) for the full setup.
 *
 * @summary Side-effect import that configures WarpDrive to use the TC39 Signals polyfill, `signal-polyfill`, for
 * reactivity.
 * @module
 */
import { Signal } from 'signal-polyfill';

import { type HooksOptions, registerSignals, type SignalHooks } from '@warp-drive/core/configure';

/**
 * Builds the {@link SignalHooks} that back ***Warp*Drive**'s reactivity with the
 * [TC39 Signals polyfill](https://github.com/proposal-signals/signal-polyfill). Each signal is a
 * `Signal.State` whose `equals` always returns `false`, so every notification counts as a change,
 * and each memo is a `Signal.Computed`. `willSyncFlushWatchers` always returns `false`, and there
 * is no `waitFor` hook, so requests are not wrapped for test waiters.
 *
 * Importing `@warp-drive/tc39-proposal-signals/install` already passes this function to
 * `registerSignals`, which passes it to `setupSignals` when no other signals are configured.
 *
 * @example
 * ```ts
 * // what importing '@warp-drive/tc39-proposal-signals/install' does
 * import { registerSignals } from '@warp-drive/core/configure';
 * import { buildSignalConfig } from '@warp-drive/tc39-proposal-signals/install';
 *
 * registerSignals(buildSignalConfig);
 * ```
 *
 * @param _options - the {@link HooksOptions} that `setupSignals` passes in; this implementation does not read them
 * @return the signal hooks backed by `signal-polyfill`
 * @summary Builds the signal hooks that back WarpDrive reactivity with `Signal.State` and `Signal.Computed` from
 * the TC39 Signals polyfill.
 * @since 5.7.0
 * @public
 */
export function buildSignalConfig(_options: HooksOptions): SignalHooks<Signal.State<unknown>> {
  return {
    createSignal: (obj: object, key: string | symbol) => new Signal.State(null, { equals: () => false }),
    consumeSignal: (signal: Signal.State<unknown>) => void signal.get(),
    notifySignal: (signal: Signal.State<unknown>) => signal.set(1),
    createMemo: <F>(object: object, key: string | symbol, fn: () => F): (() => F) => {
      const memo = new Signal.Computed<F>(fn);
      return () => memo.get();
    },
    isTracking: () => Signal.subtle.currentComputed() !== undefined,
    willSyncFlushWatchers: () => false,
  };
}

registerSignals(buildSignalConfig);
