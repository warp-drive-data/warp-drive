/**
 * Importing this entry point configures ***Warp*Drive** to use a signals graph built on
 * [alien-signals](https://github.com/stackblitz/alien-signals) for reactivity: on import it calls
 * {@link setupSignals} with {@link buildSignalConfig}.
 *
 * Add the import to the top of your application, before any other `install` import. If you have
 * tests which do not invoke your app, add it to your test setup as well:
 *
 * ```ts
 * import '@warp-drive/alien-signals/install';
 * ```
 *
 * The graph it configures composes other signals implementations into its own. A framework's
 * `install` entry point imported after this one, such as `@warp-drive/ember/install`, adds that
 * framework's signals to the graph instead of replacing it, so one store re-renders components
 * in every framework on the page. Importing this entry point after another framework's `install`
 * throws, since that framework's hooks are already configured by then.
 *
 * A library should do this only in its tests, not in its published code. To observe changes
 * from outside ***Warp*Drive**, use the `Watcher` from
 * [`@warp-drive/alien-signals/primitives`](/api/@warp-drive/alien-signals/primitives/).
 *
 * @summary Side-effect import that configures WarpDrive to use a signals graph built on alien-signals for reactivity,
 * which other frameworks' signals register with.
 * @module
 */
import { type HooksOptions, setupSignals, type SignalHooks } from '@warp-drive/core/configure';
import { peekTransient } from '@warp-drive/core/types/-private';

import {
  consumeSignal,
  createMemo,
  createSignal,
  type MemoNode,
  notifySignal,
  readMemo,
  type SignalNode,
} from './primitives.ts';

/**
 * Hooks that add another signals implementation, or a framework integration built on
 * [`@warp-drive/alien-signals/primitives`](/api/@warp-drive/alien-signals/primitives/), to the
 * graph that `@warp-drive/alien-signals/install` configures. Pass a function that builds them to
 * {@link registerSignalIntegration}, or to `registerSignals` from `@warp-drive/core/configure`.
 *
 * Every hook is optional, and an integration takes one of two shapes:
 *
 * - **It brings its own signals**, such as Ember's tags. `createSignal` creates one alongside each
 *   graph signal, and `consumeSignal` and `notifySignal` receive it whenever the graph signal is
 *   consumed or notified. When a memo returns its cached result without running its function, the
 *   graph consumes the signals that memo depends on again, so the integration still sees every
 *   signal behind a memo it reads.
 * - **It observes the graph**, as `@warp-drive/react` does. Without `createSignal`,
 *   `consumeSignal` and `notifySignal` receive the graph's own {@link SignalNode}.
 *
 * Either kind may also use `consumeMemo`, `willSyncFlushWatchers` and `waitFor`.
 *
 * Memos always come from the graph, so a `createMemo` hook is ignored. This means the
 * {@link SignalHooks} built for `setupSignals` can be registered as they are.
 *
 * @summary The hooks a signals implementation or framework integration registers with the alien-signals graph.
 * @since 5.10.0
 * @public
 */
export interface SignalIntegration<T = SignalNode> {
  /**
   * Creates this integration's own signal for `key` on `obj`, paired with the graph signal created
   * for the same key. Omit it to receive the graph's {@link SignalNode} in `consumeSignal` and
   * `notifySignal` instead.
   */
  createSignal?: (obj: object, key: string | symbol) => T;
  /**
   * Called when a signal is consumed. For an integration with its own signals, it is also called
   * for each signal behind a memo that is read without running its function.
   */
  consumeSignal?: (signal: T) => void;
  /**
   * Called when a signal is notified, after the graph has been notified.
   */
  notifySignal?: (signal: T) => void;
  /**
   * Called each time a memo is about to be read, before it runs or returns its cached result.
   */
  consumeMemo?: (memo: MemoNode) => void;
  /**
   * For an integration with its own signals: whether a signal consumed now would be tracked. When
   * this returns `false`, the graph skips consuming the signals behind a cached memo again. Omit it
   * to always consume them.
   */
  isTracking?: () => boolean;
  /**
   * See {@link SignalHooks.willSyncFlushWatchers}. The graph's `willSyncFlushWatchers` returns
   * `true` if any integration's does.
   */
  willSyncFlushWatchers?: () => boolean;
  /**
   * See {@link SignalHooks.waitFor}. The graph passes each promise through every integration's
   * `waitFor`, in the order they were registered.
   */
  waitFor?: <K>(promise: Promise<K>) => Promise<K>;
  /**
   * Ignored: memos always come from the graph.
   */
  createMemo?: unknown;
}

/**
 * The {@link SignalHooks} that {@link buildSignalConfig} returns, whose `register` hook accepts a
 * {@link SignalIntegration}.
 *
 * @summary The signal hooks backed by the alien-signals graph, which other signals implementations register with.
 * @since 5.10.0
 * @public
 */
export interface ComposingSignalHooks extends Omit<SignalHooks<SignalNode>, 'register'> {
  /**
   * Adds the {@link SignalIntegration} that `buildConfig` returns to the graph.
   */
  register: <K>(buildConfig: (options: HooksOptions) => SignalIntegration<K>) => void;
}

/** A graph signal, with the signal each integration that brings its own created for it. */
interface ComposedSignal extends SignalNode {
  foreign?: unknown[];
}

/** A graph memo, stamped while its dependencies are consumed again so that each is visited once. */
interface ComposedMemo extends MemoNode {
  replayedAt?: number;
}

/**
 * Builds the {@link SignalHooks} that back ***Warp*Drive**'s reactivity with the graph in
 * [`@warp-drive/alien-signals/primitives`](/api/@warp-drive/alien-signals/primitives/). Each
 * signal is a value-less `SignalNode`, so every notification counts as a change, and each memo is
 * a `MemoNode`.
 *
 * The hooks include a `register` hook that adds a {@link SignalIntegration} to them, which is how
 * other frameworks' `install` entry points add their signals after this one. With nothing
 * registered, `willSyncFlushWatchers` returns `false` and `waitFor` returns the promise it is
 * given.
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
 * @param options - the {@link HooksOptions} that `setupSignals` passes in, passed on to each registered integration
 * @return the signal hooks backed by the alien-signals graph
 * @summary Builds the signal hooks that back WarpDrive reactivity with signals and memos built on alien-signals, and
 * that other signals implementations register with.
 * @since 5.10.0
 * @public
 */
export function buildSignalConfig(options: HooksOptions): ComposingSignalHooks {
  // Integrations that bring their own signals. An integration's index here is the index of its
  // signal in each graph signal's `foreign` list.
  const owners: SignalIntegration<unknown>[] = [];
  // Integrations that observe the graph's own nodes.
  const signalConsumers: Array<(signal: SignalNode) => void> = [];
  const signalNotifiers: Array<(signal: SignalNode) => void> = [];
  const memoConsumers: Array<(memo: MemoNode) => void> = [];
  const flushers: Array<() => boolean> = [];
  const waiters: Array<<K>(promise: Promise<K>) => Promise<K>> = [];
  let hasCreatedSignals = false;

  // The indexes of the owners that are tracking while a cached memo's signals are consumed again.
  const replayTo: number[] = [];
  let replayEpoch = 0;

  function replay(memo: ComposedMemo): void {
    replayTo.length = 0;
    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      if (owner.consumeSignal && (!owner.isTracking || owner.isTracking())) {
        replayTo.push(i);
      }
    }
    if (replayTo.length !== 0) {
      memo.replayedAt = ++replayEpoch;
      replayDeps(memo);
    }
  }

  // Consumes each owner's signal for every signal `memo` depends on, through the memos it read.
  function replayDeps(memo: ComposedMemo): void {
    for (let link = memo.deps; link !== undefined; link = link.nextDep) {
      const dep = link.dep as ComposedSignal | ComposedMemo;
      if ('fn' in dep) {
        if (dep.replayedAt !== replayEpoch) {
          dep.replayedAt = replayEpoch;
          replayDeps(dep);
        }
      } else if (dep.foreign !== undefined) {
        const foreign = dep.foreign;
        for (let i = 0; i < replayTo.length; i++) {
          const index = replayTo[i];
          if (index < foreign.length) {
            owners[index].consumeSignal!(foreign[index]);
          }
        }
      }
    }
  }

  return {
    createSignal(obj: object, key: string | symbol): SignalNode {
      hasCreatedSignals = true;
      const signal: ComposedSignal = createSignal(obj, key);
      if (owners.length !== 0) {
        const foreign = new Array<unknown>(owners.length);
        for (let i = 0; i < owners.length; i++) {
          foreign[i] = owners[i].createSignal!(obj, key);
        }
        signal.foreign = foreign;
      }
      return signal;
    },

    consumeSignal(signal: ComposedSignal): void {
      for (let i = 0; i < signalConsumers.length; i++) {
        signalConsumers[i](signal);
      }
      consumeSignal(signal);
      const foreign = signal.foreign;
      if (foreign !== undefined) {
        for (let i = 0; i < foreign.length; i++) {
          owners[i].consumeSignal?.(foreign[i]);
        }
      }
    },

    notifySignal(signal: ComposedSignal): void {
      notifySignal(signal);
      const foreign = signal.foreign;
      if (foreign !== undefined) {
        for (let i = 0; i < foreign.length; i++) {
          owners[i].notifySignal?.(foreign[i]);
        }
      }
      for (let i = 0; i < signalNotifiers.length; i++) {
        signalNotifiers[i](signal);
      }
    },

    createMemo<F>(obj: object, key: string | symbol, fn: () => F): () => F {
      let ran = false;
      const memo = createMemo(obj, key, () => {
        ran = true;
        return fn();
      });
      return () => {
        for (let i = 0; i < memoConsumers.length; i++) {
          memoConsumers[i](memo);
        }
        if (owners.length === 0) {
          return readMemo(memo);
        }
        ran = false;
        try {
          return readMemo(memo);
        } finally {
          // A memo that ran its function consumed its signals as it read them. A cached one read
          // nothing, so consume the signals it depends on again for owners that track their own.
          if (!ran) replay(memo);
        }
      };
    },

    willSyncFlushWatchers(): boolean {
      for (let i = 0; i < flushers.length; i++) {
        if (flushers[i]()) return true;
      }
      return false;
    },

    waitFor<K>(promise: Promise<K>): Promise<K> {
      for (let i = 0; i < waiters.length; i++) {
        promise = waiters[i](promise);
      }
      return promise;
    },

    register<K>(buildConfig: (options: HooksOptions) => SignalIntegration<K>): void {
      const integration = buildConfig(options) as SignalIntegration<unknown>;
      if (integration.createSignal) {
        if (hasCreatedSignals) {
          throw new Error(
            `Cannot register signal hooks that create their own signals after WarpDrive has created signals, since the signals created before would never notify them. Import each framework's 'install' entry point at the top of your app, before using WarpDrive.`
          );
        }
        owners.push(integration);
      } else {
        if (integration.consumeSignal) signalConsumers.push(integration.consumeSignal);
        if (integration.notifySignal) signalNotifiers.push(integration.notifySignal);
      }
      if (integration.consumeMemo) memoConsumers.push(integration.consumeMemo);
      if (integration.willSyncFlushWatchers) flushers.push(integration.willSyncFlushWatchers);
      if (integration.waitFor) waiters.push(integration.waitFor);
    },
  };
}

/**
 * Adds a {@link SignalIntegration} to the graph that `@warp-drive/alien-signals/install`
 * configured. Use it to build a framework integration on
 * [`@warp-drive/alien-signals/primitives`](/api/@warp-drive/alien-signals/primitives/), the way
 * `@warp-drive/react` does.
 *
 * Hooks that also work on their own, without this graph, should be passed to `registerSignals`
 * from `@warp-drive/core/configure` instead. It registers them with this graph when the graph is
 * configured, and configures them with `setupSignals` when it is not.
 *
 * Throws if the graph is not the configured signals implementation, or if the integration creates
 * its own signals and ***Warp*Drive** has already created signals.
 *
 * @example
 * ```ts
 * import { isTracking } from '@warp-drive/alien-signals/primitives';
 * import { registerSignalIntegration } from '@warp-drive/alien-signals/install';
 *
 * registerSignalIntegration(() => ({
 *   consumeSignal: (signal) => {
 *     if (!isTracking()) watchInCurrentComponent(signal);
 *   },
 *   consumeMemo: (memo) => {
 *     if (!isTracking()) watchInCurrentComponent(memo);
 *   },
 * }));
 * ```
 *
 * @param buildConfig - a function that takes the {@link HooksOptions} and returns the integration's hooks
 * @summary Adds a signals implementation or framework integration to the alien-signals graph.
 * @since 5.10.0
 * @public
 */
export function registerSignalIntegration<T>(buildConfig: (options: HooksOptions) => SignalIntegration<T>): void {
  const signalHooks: SignalHooks | null = peekTransient('signalHooks');
  if (!signalHooks?.register) {
    throw new Error(
      `Cannot register a signal integration before '@warp-drive/alien-signals/install' has configured WarpDrive's signals. Import it first.`
    );
  }
  signalHooks.register(buildConfig as (options: HooksOptions) => SignalHooks<T>);
}

const configured: SignalHooks | null = peekTransient('signalHooks');
// Hooks that can register others are already composing. Most likely this is a second copy of
// this module, evaluated because of a bundler bug, so keep the hooks frameworks registered with.
if (!configured?.register) {
  if (configured) {
    throw new Error(
      `'@warp-drive/alien-signals/install' must be imported before any other signals configuration. WarpDrive's signal hooks are already configured, most likely by another framework's 'install' entry point (such as '@warp-drive/ember/install') or a call to 'setupSignals'. Import '@warp-drive/alien-signals/install' first so that other frameworks register their signals with it.`
    );
  }
  setupSignals(buildSignalConfig);
}
