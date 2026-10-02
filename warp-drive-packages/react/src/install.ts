/**
 * {@include ./install.md}
 *
 * See the [React section of Installation](/guides/installation/#react) for the full setup.
 *
 * @summary Side-effect import that configures WarpDrive to use `@warp-drive/alien-signals` based reactivity, and
 * registers React with it so its data updates re-render React components.
 * @module
 */

import { use } from 'react';

import { registerSignalIntegration, type SignalIntegration } from '@warp-drive/alien-signals/install';
import { hasSubscribers, isTracking, type MemoNode, type SignalNode } from '@warp-drive/alien-signals/primitives';
import { LOG_REACT_SIGNAL_INTEGRATION } from '@warp-drive/core/build-config/debugging';
import { TESTING } from '@warp-drive/core/build-config/env';
import type { HooksOptions } from '@warp-drive/core/configure';

import { WatcherContext } from './-private/reactive-context';

/**
 * Adds `node` to the watcher of the nearest `ReactiveContext`, if we are rendering inside one.
 *
 * Callers skip this while a memo is computing: the memo is itself watched, so the watcher
 * already hears about changes to everything it reads.
 */
function tryConsumeContext(node: SignalNode | MemoNode): void {
  // `use` logs before throwing when called outside of a render, so silence it while we try
  // oxlint-disable-next-line no-console
  const logError = console.error;
  // oxlint-disable-next-line no-console
  console.error = noop;
  try {
    // ensure signals are watched by our closest watcher
    const watcher = use(WatcherContext);
    watcher?.watcher.watch(node);
    if (LOG_REACT_SIGNAL_INTEGRATION) {
      // oxlint-disable-next-line no-console
      console.log(`[WarpDrive] Consumed Context Signal`, node, watcher);
    }
  } catch {
    // if we are not in a React context, we will Error
    // so we just ignore it.
    if (LOG_REACT_SIGNAL_INTEGRATION) {
      // oxlint-disable-next-line no-console
      console.log(`[WarpDrive] No Context Available To Consume Signal`, node);
    }
  } finally {
    // oxlint-disable-next-line no-console
    console.error = logError;
  }
}

function noop(): void {}

let pending: Promise<unknown>[];
/**
 * Resolves once all pending requests started via WarpDrive's React signal
 * integration have settled. Only tracks requests while `TESTING` is enabled;
 * a no-op otherwise.
 *
 * @summary Resolves once all requests tracked by the React signal integration have settled, for use in tests; a no-op
 * unless `TESTING` is enabled.
 * @public
 */
export async function settled(): Promise<void> {
  if (TESTING) {
    // in testing mode we provide a test waiter integration
    if (!pending || !pending.length) return;
    const current = pending ?? [];
    pending = [];
    await Promise.allSettled(current);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    return settled();
  }
}

/**
 * Builds the {@link SignalIntegration} that connects the
 * [`@warp-drive/alien-signals`](/api/@warp-drive/alien-signals/install/) graph to React rendering
 * and test waiters. Signals and memos read while a component renders are watched by the watcher of
 * its nearest `ReactiveContext`.
 *
 * Importing `@warp-drive/react/install` imports `@warp-drive/alien-signals/install` and passes
 * this function to `registerSignalIntegration`, so React components re-render alongside any other
 * framework registered with the same graph.
 *
 * @summary Builds the hooks that connect the `@warp-drive/alien-signals` graph to React rendering
 * and test waiters.
 * @public
 */
export function buildSignalConfig(_options: HooksOptions): SignalIntegration {
  return {
    // called with each signal as it is consumed, and with each memo just before it is read, so
    // that a memo we are watching already has a subscriber when it is read and is not queued to
    // release its dependencies
    consumeSignal: (node: SignalNode | MemoNode) => {
      if (!isTracking()) tryConsumeContext(node);
    },

    notifySignal: (signal: SignalNode | MemoNode) => {
      if (LOG_REACT_SIGNAL_INTEGRATION) {
        if (hasSubscribers(signal)) {
          // oxlint-disable-next-line no-console
          console.log(`[WarpDrive] Notified Signal`, signal);
        } else {
          // oxlint-disable-next-line no-console
          console.log(`[WarpDrive] Notified Signal That Has No Watcher`, signal);
        }
      }
    },

    waitFor: (promise) => {
      if (TESTING) {
        pending = pending || [];
        const newPromise = promise.finally(() => {
          pending = pending.filter((p) => p !== newPromise);
        });
        pending.push(newPromise);
        return newPromise;
      }
      return promise;
    },
  };
}

registerSignalIntegration(buildSignalConfig);
