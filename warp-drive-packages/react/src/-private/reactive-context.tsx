import { createContext, type JSX, type ReactNode, useSyncExternalStore, type Context, useMemo } from "react";

import { Watcher } from "@warp-drive/alien-signals/primitives";
import { LOG_REACT_SIGNAL_INTEGRATION } from "@warp-drive/core/build-config/debugging";

let nextFlush: Promise<void> | null = null;
let watchers: WatcherState[] = [];
let watcherId = 0;

interface WatcherState {
  watcherId: number;
  pending: boolean;
  destroyed: boolean;
  notifyReact: (() => void) | null;
  watcher: Watcher;

  // the extra wrapper returned here ensures that the context value for the watcher
  // changes causing a re-render when the watcher is updated.
  snapshot: { watcher: Watcher } | null;
}

function clearWatcher(state: WatcherState) {
  state.watcher.unwatchAll();
}

function flush(state: WatcherState) {
  state.pending = false;
  if (state.destroyed) {
    if (LOG_REACT_SIGNAL_INTEGRATION) {
      // eslint-disable-next-line no-console
      console.log(`[WarpDrive] Detected Watcher Destroyed During Notify Flush, clearing signals`);
    }
    state.snapshot = null;
    clearWatcher(state);
    return;
  }

  if (LOG_REACT_SIGNAL_INTEGRATION) {
    /* eslint-disable no-console */
    console.log(`[WarpDrive] Notifying React That WatcherContext:${state.watcherId} Has Updated`);
    console.log("all signals", new Set(state.watcher.watched));
    console.log("dirty signals", new Set(state.watcher.getPending()));
    /* eslint-enable no-console */
  }

  // any time signals have changed, we notify React that our store has updated
  state.snapshot = { watcher: state.watcher };
  if (state.notifyReact) state.notifyReact();

  // tell the Watcher to start watching for changes again
  // by signaling that notifications have been flushed.
  state.watcher.rearm();
}

function _createWatcher() {
  const id = watcherId++;
  if (LOG_REACT_SIGNAL_INTEGRATION) {
    // eslint-disable-next-line no-console
    console.log(`[WarpDrive] Creating a WatcherContext:${id}`);
  }
  const state: WatcherState = {
    watcherId: id,
    pending: false,
    destroyed: false,
    notifyReact: null as (() => void) | null,
    watcher: null as unknown as Watcher,

    // the extra wrapper returned here ensures that the context value for the watcher
    // changes causing a re-render when the watcher is updated.
    snapshot: null as { watcher: Watcher } | null,
  };

  state.watcher = new Watcher(() => {
    if (LOG_REACT_SIGNAL_INTEGRATION) {
      // eslint-disable-next-line no-console
      console.log(`watcher ${state.watcherId} notified`, state.watcher);
    }
    if (!state.pending && !state.destroyed) {
      watchers.push(state);
      state.pending = true;

      if (!nextFlush) {
        nextFlush = new Promise((resolve) => {
          queueMicrotask(() => {
            queueMicrotask(() => {
              queueMicrotask(() => {
                watchers.forEach(flush);
                if (LOG_REACT_SIGNAL_INTEGRATION) {
                  // eslint-disable-next-line no-console
                  console.log(
                    "Flushed watcher:",
                    watchers.map((w) => w.watcherId)
                  );
                }
                watchers = [];
                nextFlush = null;

                resolve();
              });
            });
          });
        });
      }
    } else if (state.destroyed) {
      if (LOG_REACT_SIGNAL_INTEGRATION) {
        // eslint-disable-next-line no-console
        console.log(`[WarpDrive] Detected Watcher Destroyed During Notify, clearing signals`);
      }
      // if we are destroyed, we clear the watcher signals
      // so that it does not continue to watch for changes.
      state.snapshot = null;
      clearWatcher(state);
    }
  });

  state.snapshot = { watcher: state.watcher };

  return state;
}

export function useWatcher(): { watcher: Watcher } | null {
  const state = useMemo(_createWatcher, []);

  return useSyncExternalStore(
    (notifyChanged: () => void) => {
      if (LOG_REACT_SIGNAL_INTEGRATION) {
        // eslint-disable-next-line no-console
        console.log(`[WarpDrive] Subscribing to Watcher`);
      }
      state.destroyed = false;
      state.notifyReact = notifyChanged;

      // re-arm the watcher in case it was notified while we were unsubscribed
      state.watcher.rearm();

      return () => {
        if (LOG_REACT_SIGNAL_INTEGRATION) {
          // eslint-disable-next-line no-console
          console.log(`[WarpDrive] Deactivating Watcher Subscription`);
        }
        state.destroyed = true;
        state.notifyReact = null;
      };
    },
    () => state.snapshot
  );
}

/**
 * @summary React context holding the signal watcher that the nearest `ReactiveContext` uses to track which WarpDrive
 * signals its children read.
 * @category Contexts
 */
export const WatcherContext: Context<{
  /**
   * The `Watcher` from `@warp-drive/alien-signals/primitives` used to observe signal changes for the
   * nearest {@link ReactiveContext}.
   */
  watcher: Watcher;
} | null> = createContext<{
  watcher: Watcher;
} | null>(null);

/**
 * Re-renders its `children` when a WarpDrive signal they read changes.
 * `<Request />` already wraps its content in one; wrap any other component
 * that reads reactive WarpDrive data, such as a record's fields.
 *
 * The JS API example in [Reactive Control Flow](/guides/the-manual/reactivity/control-flow)
 * shows it wrapping a component that reads request state with `getRequestState`.
 *
 * It accepts a single prop, `children`.
 *
 * @example
 * ```tsx
 * import { ReactiveContext } from "@warp-drive/react";
 *
 * export function UserName({ user }: { user: User }) {
 *   return (
 *     <ReactiveContext>
 *       <span>{user.name}</span>
 *     </ReactiveContext>
 *   );
 * }
 * ```
 *
 * @summary Component that re-renders its children when WarpDrive signals they read change, by providing a signal
 * watcher through `WatcherContext`.
 * @category Components
 * @public
 */
export function ReactiveContext({ children }: { children: ReactNode }): JSX.Element {
  const watcher = useWatcher();
  /**
   * Unlike other frameworks, React does not have a built-in way to provide
   * a context value other than by rendering an extra component.
   *
   */
  return <WatcherContext value={watcher}>{children}</WatcherContext>;
}
