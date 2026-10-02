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
 * Memos, such as the ones behind derived fields, always come from this graph, so they only
 * recompute when a signal ***Warp*Drive** manages changes. A memo that reads state only a
 * framework tracks, such as an Ember `@tracked` property, keeps returning its cached value when
 * that state changes.
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
  isTracking,
  type MemoNode,
  notifySignal,
  readMemo,
  type SignalNode,
  Watcher,
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
 *   consumed or notified. Each memo the integration reads also gets one of its signals, created
 *   for the memo's key the first time it is read while the integration is tracking. Reading the
 *   memo consumes that signal, whether the memo runs or returns its cached result, and the graph
 *   notifies it as soon as anything the memo depends on changes. To the integration, a memo is
 *   just one more signal.
 * - **It observes the graph**, as `@warp-drive/react` does. Without `createSignal`,
 *   `consumeSignal` receives the graph's own nodes: each {@link SignalNode} when it is consumed,
 *   and each {@link MemoNode} just before it is read, whether it runs or returns its cached
 *   result. `notifySignal` receives each {@link SignalNode} when it is notified.
 *
 * Either kind may also use `willSyncFlushWatchers` and `waitFor`.
 *
 * Memos always come from the graph, so a `createMemo` hook is ignored. This means the
 * {@link SignalHooks} built for `setupSignals` can be registered as they are.
 *
 * @summary The hooks a signals implementation or framework integration registers with the alien-signals graph.
 * @since 5.10.0
 * @public
 */
export interface SignalIntegration<T = SignalNode | MemoNode> {
  /**
   * Creates this integration's own signal for `key` on `obj`, paired with the graph signal created
   * for the same key. Omit it to receive the graph's own nodes in `consumeSignal` and
   * `notifySignal` instead.
   */
  createSignal?: (obj: object, key: string | symbol) => T;
  /**
   * Called when a signal is consumed. For an integration with its own signals, it is also called
   * with the integration's signal for a memo each time that memo is read. For an integration that
   * observes the graph, it is also called with each memo just before the memo is read.
   */
  consumeSignal?: (signal: T) => void;
  /**
   * Called when a signal is notified, after the graph has been notified. For an integration with
   * its own signals, it is also called with the integration's signal for a memo once something the
   * memo depends on changes.
   */
  notifySignal?: (signal: T) => void;
  /**
   * For an integration with its own signals: whether a signal consumed now would be tracked. When
   * this returns `false`, reading a memo neither consumes the integration's signal for it nor
   * subscribes that signal to the memo's changes. Omit it to treat every read as tracked.
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

/**
 * A graph signal, with the signals that the integrations bringing their own created for it: the
 * signal itself when exactly one such integration is registered, or one per integration, in the
 * order they registered.
 */
interface ComposedSignal extends SignalNode {
  foreign?: unknown;
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
  // signal in each list of foreign signals, used when more than one is registered.
  const owners: SignalIntegration<unknown>[] = [];
  // Integrations that observe the graph's own nodes.
  const nodeConsumers: Array<(node: SignalNode | MemoNode) => void> = [];
  const signalNotifiers: Array<(signal: SignalNode) => void> = [];
  const flushers: Array<() => boolean> = [];
  const waiters: Array<<K>(promise: Promise<K>) => Promise<K>> = [];
  let hasCreatedSignals = false;

  // Owners can't register once signals exist, so after the first signal this is fixed.
  function createForeign(obj: object, key: string | symbol): unknown {
    if (owners.length === 1) {
      return owners[0].createSignal!(obj, key);
    }
    const foreign = new Array<unknown>(owners.length);
    for (let i = 0; i < owners.length; i++) {
      foreign[i] = owners[i].createSignal!(obj, key);
    }
    return foreign;
  }

  function consumeForeign(foreign: unknown): void {
    if (owners.length === 1) {
      owners[0].consumeSignal?.(foreign);
      return;
    }
    const signals = foreign as unknown[];
    for (let i = 0; i < signals.length; i++) {
      owners[i].consumeSignal?.(signals[i]);
    }
  }

  function notifyForeign(foreign: unknown): void {
    if (owners.length === 1) {
      owners[0].notifySignal?.(foreign);
      return;
    }
    const signals = foreign as unknown[];
    for (let i = 0; i < signals.length; i++) {
      owners[i].notifySignal?.(signals[i]);
    }
  }

  function isAnyOwnerTracking(): boolean {
    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      if (!owner.isTracking || owner.isTracking()) return true;
    }
    return false;
  }

  return {
    createSignal(obj: object, key: string | symbol): SignalNode {
      hasCreatedSignals = true;
      const signal: ComposedSignal = createSignal(obj, key);
      if (owners.length !== 0) {
        signal.foreign = createForeign(obj, key);
      }
      return signal;
    },

    consumeSignal(signal: ComposedSignal): void {
      for (let i = 0; i < nodeConsumers.length; i++) {
        nodeConsumers[i](signal);
      }
      consumeSignal(signal);
      if (signal.foreign !== undefined) {
        consumeForeign(signal.foreign);
      }
    },

    notifySignal(signal: ComposedSignal): void {
      notifySignal(signal);
      if (signal.foreign !== undefined) {
        notifyForeign(signal.foreign);
      }
      for (let i = 0; i < signalNotifiers.length; i++) {
        signalNotifiers[i](signal);
      }
    },

    createMemo<F>(obj: object, key: string | symbol, fn: () => F): () => F {
      const memo = createMemo(obj, key, fn);
      // Owners see the memo as a single signal of their own: a gate, notified when anything the
      // memo depends on changes. Both are created the first time an owner reads the memo.
      let foreign: unknown;
      let gate: Watcher | undefined;
      let armed = false;
      return () => {
        // Observers are told about the memo before it is read, so that one watching it gives it a
        // subscriber before it runs and it is not queued to release its dependencies.
        for (let i = 0; i < nodeConsumers.length; i++) {
          nodeConsumers[i](memo);
        }
        // Inside another memo, that memo's own gate already covers this read.
        if (owners.length !== 0 && !isTracking() && isAnyOwnerTracking()) {
          if (gate === undefined) {
            foreign = createForeign(obj, key);
            const watcher = new Watcher(() => {
              armed = false;
              notifyForeign(foreign);
              // Stop watching until an owner reads the memo again, so that an unread memo can
              // still release its dependencies.
              watcher.unwatchAll();
            });
            gate = watcher;
          }
          // Watch before reading, so that the memo has a subscriber and is not queued to release
          // its dependencies.
          if (!armed) {
            armed = true;
            gate.watch(memo);
          }
          consumeForeign(foreign);
        }
        return readMemo(memo);
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
        if (integration.consumeSignal) nodeConsumers.push(integration.consumeSignal);
        if (integration.notifySignal) signalNotifiers.push(integration.notifySignal);
      }
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
 *   // called with each signal as it is consumed, and each memo just before it is read
 *   consumeSignal: (node) => {
 *     if (!isTracking()) watchInCurrentComponent(node);
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
