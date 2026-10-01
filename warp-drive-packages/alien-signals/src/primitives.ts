/**
 * The reactive primitives behind `@warp-drive/alien-signals`: a small signals graph built on the
 * push-pull algorithm from [alien-signals](https://github.com/stackblitz/alien-signals).
 *
 * Most apps only need the [`install`](/api/@warp-drive/alien-signals/install/) entry point. Import
 * from this module when you are building a framework integration that needs to observe
 * ***Warp*Drive**'s signals, the way `@warp-drive/react` does for its `ReactiveContext`:
 *
 * ```ts
 * import { Watcher, createSignal, consumeSignal, notifySignal } from '@warp-drive/alien-signals/primitives';
 * ```
 *
 * The graph implements only what ***Warp*Drive**'s {@link SignalHooks} need, not the TC39 Signals
 * API:
 *
 * - a {@link SignalNode} holds no value. It is a "side signal" that tells consumers the value it
 *   guards has changed, so every {@link notifySignal} counts as a change.
 * - a {@link MemoNode} caches the result of a function, including a thrown error, until a signal
 *   or memo it read changes.
 * - a {@link Watcher} is told, once, when anything it watches may have changed.
 *
 * A memo that nothing subscribes to (no watcher, and no other memo that reads it) releases its
 * links to the signals it read in a microtask after it is read, so a long-lived signal never keeps
 * a short-lived memo, or the object that owns it, alive. Its next read recomputes it.
 *
 * @summary Signals, memos and a watcher, built on alien-signals, that back WarpDrive reactivity and
 * let framework integrations observe it.
 * @module
 */
import { createReactiveSystem, type Link, type ReactiveNode } from 'alien-signals/system';

import { DEBUG } from '@warp-drive/core/build-config/env';
// oxlint-disable-next-line no-unused-vars
import type { SignalHooks } from '@warp-drive/core/configure';

// The `ReactiveFlags` that `alien-signals/system` reads and writes. They are re-declared here
// because the package types them as an ambient `const enum`, which `isolatedModules` can't inline.
const Mutable = 1;
const Watching = 2;
const RecursedCheck = 4;
const Dirty = 16;
const Pending = 32;
// Our own flag, above the range `alien-signals/system` uses; it preserves bits it does not own.
const HasError = 64;

/**
 * A signal created by {@link createSignal}. It carries no value: it only records which memos and
 * watchers depend on it, so that {@link notifySignal} can tell them the value it guards changed.
 *
 * Its fields belong to the graph and must not be read or written directly.
 *
 * @summary The opaque node returned by `createSignal`, which tracks the memos and watchers that consumed it.
 * @public
 */
export interface SignalNode extends ReactiveNode {
  /**
   * The object the signal belongs to. Only present in development builds.
   *
   * @internal
   */
  obj?: object;
  /**
   * The key the signal was created for. Only present in development builds.
   *
   * @internal
   */
  key?: string | symbol;
  /**
   * The value of the notification counter when the signal was last notified, so a
   * {@link Watcher} can report it as pending. Only present in development builds.
   *
   * @internal
   */
  notifiedAt?: number;
}

/**
 * A memo created by {@link createMemo}. Read it with {@link readMemo}.
 *
 * Its fields belong to the graph and must not be read or written directly.
 *
 * @summary The opaque node returned by `createMemo`, which caches a function's result until something it read changes.
 * @public
 */
export interface MemoNode<T = unknown> extends ReactiveNode {
  /** @internal */
  fn: () => T;
  /**
   * The cached result, or the cached error when the `HasError` flag is set.
   *
   * @internal
   */
  value: T | unknown;
  /**
   * Whether the memo is queued to release its dependencies.
   *
   * @internal
   */
  queued: boolean;
  /**
   * The object the memo belongs to. Only present in development builds.
   *
   * @internal
   */
  obj?: object;
  /**
   * The key the memo was created for. Only present in development builds.
   *
   * @internal
   */
  key?: string | symbol;
}

/** The memo, if any, whose function is running; reads made while it runs become its dependencies. */
let activeSub: MemoNode | undefined;
/** Incremented on each memo evaluation; `link` uses it to skip duplicate links within one run. */
let cycle = 0;
/** Development builds only: incremented on each notifySignal, for `Watcher.getPending()`. */
let notifications = 0;

/** Watchers notified during the current propagation, delivered once it has finished. */
const notified: Array<Watcher | undefined> = [];
let notifiedLength = 0;

/** Memos read with no subscriber, which release their dependencies on the next microtask. */
let releaseQueue: MemoNode[] = [];
let releaseScheduled = false;

const { link, unlink, propagate, checkDirty, shallowPropagate } = createReactiveSystem({
  // Signals are never marked dirty (notifySignal dirties their subscribers instead), so
  // the only nodes the system asks to update are memos.
  update: (node) => updateMemo(node as MemoNode),
  // Only watchers carry the `Watching` flag, so they are the only nodes notified. Clearing the
  // flag means a watcher is notified at most once until it calls `rearm()`.
  notify(node) {
    node.flags &= ~Watching;
    notified[notifiedLength++] = node as Watcher;
  },
  // A memo nothing subscribes to anymore drops its own dependencies so that the signals it read
  // don't keep it alive. It recomputes on its next read. Signals have nothing to release.
  unwatched(node) {
    if (node.depsTail !== undefined) {
      node.flags = Mutable | Dirty;
      disposeDeps(node);
    }
  },
});

/**
 * Creates a {@link SignalNode} for `key` on `obj`. This is the `createSignal` hook of the
 * {@link SignalHooks} that the `install` entry point configures.
 *
 * @example
 * ```ts
 * import { consumeSignal, createSignal, notifySignal } from '@warp-drive/alien-signals/primitives';
 *
 * const signal = createSignal(user, 'name');
 * consumeSignal(signal); // inside a memo, the memo now depends on the signal
 * notifySignal(signal); // the memo recomputes on its next read
 * ```
 *
 * @param obj - the object the signal belongs to, kept for debugging in development builds
 * @param key - the key the signal is for, kept for debugging in development builds
 * @return a new signal
 * @summary Creates a value-less signal that memos and watchers can depend on and that `notifySignal` marks as changed.
 * @since 5.10.0
 * @public
 */
export function createSignal(obj: object, key: string | symbol): SignalNode {
  return DEBUG
    ? { subs: undefined, subsTail: undefined, flags: Mutable, obj, key }
    : { subs: undefined, subsTail: undefined, flags: Mutable };
}

/**
 * Records that the memo whose function is running read `signal`, so that a later
 * {@link notifySignal} makes that memo recompute. Outside of a memo it does nothing; use
 * {@link Watcher.watch} to observe a signal from outside the graph.
 *
 * @example
 * ```ts
 * import { consumeSignal, createMemo, readMemo } from '@warp-drive/alien-signals/primitives';
 *
 * const fullName = createMemo(user, 'fullName', () => {
 *   consumeSignal(nameSignal);
 *   return `${user.first} ${user.last}`;
 * });
 * readMemo(fullName);
 * ```
 *
 * @param signal - the signal that was read
 * @summary Makes the running memo depend on a signal; a no-op outside of a memo.
 * @since 5.10.0
 * @public
 */
export function consumeSignal(signal: SignalNode): void {
  if (activeSub !== undefined) {
    link(signal, activeSub, cycle);
  }
}

/**
 * Tells everything that depends on `signal` that the value it guards changed: memos that read it
 * recompute on their next read, and each {@link Watcher} watching it, or a memo that read it, is
 * notified. Watchers are notified after the whole graph has been marked, before this returns.
 *
 * @example
 * ```ts
 * import { createSignal, notifySignal } from '@warp-drive/alien-signals/primitives';
 *
 * const signal = createSignal(user, 'name');
 * user.cachedName = 'Chris';
 * notifySignal(signal);
 * ```
 *
 * @param signal - the signal whose value changed
 * @summary Marks everything that depends on a signal as changed and notifies the watchers that observe it.
 * @since 5.10.0
 * @public
 */
export function notifySignal(signal: SignalNode): void {
  if (DEBUG) {
    signal.notifiedAt = ++notifications;
  }
  const subs = signal.subs;
  if (subs !== undefined) {
    // Mark the whole graph below the signal as pending, then its direct subscribers as dirty,
    // so they recompute without having to re-check the signal.
    propagate(subs, false);
    shallowPropagate(subs);
    if (notifiedLength !== 0) {
      deliverNotifications();
    }
  }
}

/**
 * Creates a {@link MemoNode} that caches the result of `fn`. Read it with {@link readMemo}: the
 * first read runs `fn`, and later reads return the cached result until a signal or memo `fn` read
 * changes. If `fn` throws, the error is cached and rethrown by each read until then.
 *
 * @example
 * ```ts
 * import { createMemo, readMemo } from '@warp-drive/alien-signals/primitives';
 *
 * const fullName = createMemo(user, 'fullName', () => `${user.firstName} ${user.lastName}`);
 * readMemo(fullName); // runs the function
 * readMemo(fullName); // returns the cached result
 * ```
 *
 * @param obj - the object the memo belongs to, kept for debugging in development builds
 * @param key - the key the memo is for, kept for debugging in development builds
 * @param fn - the function whose result to cache
 * @return a new memo, which has not run `fn` yet
 * @summary Creates a memo that caches a function's result, or its error, until a signal or memo it read changes.
 * @since 5.10.0
 * @public
 */
export function createMemo<T>(obj: object, key: string | symbol, fn: () => T): MemoNode<T> {
  // A new memo starts dirty so that its first read runs `fn` through `updateMemo`.
  return DEBUG
    ? {
        deps: undefined,
        depsTail: undefined,
        subs: undefined,
        subsTail: undefined,
        flags: Mutable | Dirty,
        fn,
        value: undefined,
        queued: false,
        obj,
        key,
      }
    : {
        deps: undefined,
        depsTail: undefined,
        subs: undefined,
        subsTail: undefined,
        flags: Mutable | Dirty,
        fn,
        value: undefined,
        queued: false,
      };
}

/**
 * Returns the latest result of `memo`, running its function only if something it read changed
 * since the last run. Inside another memo, that memo now depends on `memo`.
 *
 * Throws the cached error if the function threw, and throws if `memo` reads itself, directly or
 * through other memos.
 *
 * @example
 * ```ts
 * import { createMemo, readMemo } from '@warp-drive/alien-signals/primitives';
 *
 * const total = createMemo(cart, 'total', () => cart.items.reduce((sum, item) => sum + item.price, 0));
 * readMemo(total);
 * ```
 *
 * @param memo - the memo to read
 * @return the memo's current result
 * @summary Returns a memo's current result, recomputing it only when something it read changed.
 * @since 5.10.0
 * @public
 */
export function readMemo<T>(memo: MemoNode<T>): T {
  const flags = memo.flags;
  if (flags & RecursedCheck) {
    throw new Error(`Detected a cycle: a memo read itself while computing its value`);
  }
  if (
    flags & Dirty ||
    (flags & Pending && (checkDirty(memo.deps!, memo) || ((memo.flags = flags & ~Pending), false)))
  ) {
    if (updateMemo(memo)) {
      const subs = memo.subs;
      if (subs !== undefined) {
        shallowPropagate(subs);
      }
    }
  }

  const sub = activeSub;
  if (sub !== undefined) {
    link(memo, sub, cycle);
  } else if (memo.subs === undefined) {
    scheduleRelease(memo);
  }

  if (memo.flags & HasError) {
    throw memo.value;
  }
  return memo.value as T;
}

/**
 * Whether a memo's function is running, which means any signal or memo read now becomes one of
 * its dependencies.
 *
 * A framework integration can use this to skip work for reads it doesn't need to observe
 * directly: when a watched memo reads a signal, the watcher already learns about changes to that
 * signal through the memo.
 *
 * @example
 * ```ts
 * import { consumeSignal, isTracking } from '@warp-drive/alien-signals/primitives';
 *
 * function consume(signal) {
 *   if (!isTracking()) watchInCurrentComponent(signal);
 *   consumeSignal(signal);
 * }
 * ```
 *
 * @return true while a memo's function is running
 * @summary Whether a memo is computing, so that signals read now become its dependencies.
 * @since 5.10.0
 * @public
 */
export function isTracking(): boolean {
  return activeSub !== undefined;
}

/**
 * Whether any memo or {@link Watcher} depends on `node`. Useful for debug logging.
 *
 * @example
 * ```ts
 * import { hasSubscribers } from '@warp-drive/alien-signals/primitives';
 *
 * if (!hasSubscribers(signal)) console.log('nothing will update');
 * ```
 *
 * @param node - a signal or memo
 * @return true if a memo or watcher depends on `node`
 * @summary Whether any memo or watcher depends on a signal or memo.
 * @since 5.10.0
 * @public
 */
export function hasSubscribers(node: SignalNode | MemoNode): boolean {
  return node.subs !== undefined;
}

/**
 * Observes signals and memos from outside the graph. The `notify` callback passed to the
 * constructor runs, at most once, as soon as anything watched may have changed: after a
 * {@link notifySignal} of a watched signal, or of a signal a watched memo read. Call
 * {@link Watcher.rearm} once you have handled the notification to be notified of the next change.
 *
 * `notify` runs synchronously, inside the `notifySignal` call that caused it, so it should only
 * schedule work. Reading or notifying signals from within it is not supported.
 *
 * A watched memo should be read after it is watched, since the watcher only hears about changes
 * to what the memo read during its last run.
 *
 * @example
 * ```ts
 * import { Watcher, readMemo } from '@warp-drive/alien-signals/primitives';
 *
 * const watcher = new Watcher(() => {
 *   queueMicrotask(() => {
 *     render();
 *     watcher.rearm();
 *   });
 * });
 *
 * watcher.watch(memo);
 * readMemo(memo);
 *
 * // when the view goes away
 * watcher.unwatchAll();
 * ```
 *
 * @summary Observes signals and memos, calling back once when any of them may have changed until it is re-armed.
 * @since 5.10.0
 * @public
 */
export class Watcher implements ReactiveNode {
  /** @internal */
  deps: Link | undefined = undefined;
  /** @internal */
  depsTail: Link | undefined = undefined;
  /** @internal */
  flags: number = Watching;
  /** @internal */
  _notify: () => void;
  /**
   * Everything watched, so that watching something twice doesn't link it twice.
   *
   * @internal
   */
  _watched: Set<SignalNode | MemoNode> = new Set();
  /**
   * Development builds only: the notification counter when the watcher was last armed.
   *
   * @internal
   */
  _armedAt: number = notifications;

  /**
   * @param notify - called once when anything watched may have changed, until {@link Watcher.rearm} is called
   */
  constructor(notify: () => void) {
    this._notify = notify;
  }

  /**
   * Everything this watcher is watching. Useful for debug logging.
   */
  get watched(): ReadonlySet<SignalNode | MemoNode> {
    return this._watched;
  }

  /**
   * Whether `notify` has been called since the watcher was created or last re-armed.
   */
  get isNotified(): boolean {
    return (this.flags & Watching) === 0;
  }

  /**
   * Starts watching a signal or memo. Watching something already watched does nothing.
   *
   * @param node - the signal or memo to watch
   */
  watch(node: SignalNode | MemoNode): void {
    const watched = this._watched;
    if (!watched.has(node)) {
      watched.add(node);
      link(node, this, cycle);
    }
  }

  /**
   * Re-enables `notify` after a notification has been handled, so that the next change to
   * anything watched calls it again.
   */
  rearm(): void {
    this.flags = Watching;
    if (DEBUG) {
      this._armedAt = notifications;
    }
  }

  /**
   * Lists what this watcher is watching that may have changed since it was created or last
   * re-armed: memos that are due to recompute, and, in development builds only, signals that
   * have been notified. Useful for debug logging; it walks everything watched.
   *
   * @return the watched signals and memos that may have changed
   */
  getPending(): Array<SignalNode | MemoNode> {
    const pending: Array<SignalNode | MemoNode> = [];
    const armedAt = this._armedAt;
    for (const node of this._watched) {
      if ('fn' in node ? node.flags & (Dirty | Pending) : DEBUG && (node.notifiedAt ?? 0) > armedAt) {
        pending.push(node);
      }
    }
    return pending;
  }

  /**
   * Stops watching everything and re-arms the watcher. A memo that nothing else depends on
   * releases its own dependencies and recomputes on its next read.
   */
  unwatchAll(): void {
    this._watched.clear();
    this.flags = Watching;
    if (DEBUG) {
      this._armedAt = notifications;
    }
    disposeDeps(this);
  }
}

/**
 * Runs `memo`'s function as the active subscriber, re-linking what it reads and unlinking what it
 * no longer reads. Caches a thrown error instead of letting it escape, so that a throw can't
 * abandon a `checkDirty` walk midway. Returns whether dependents need to recompute.
 */
function updateMemo(memo: MemoNode): boolean {
  memo.depsTail = undefined;
  memo.flags = Mutable | RecursedCheck;
  const prevSub = activeSub;
  activeSub = memo;
  ++cycle;
  const oldValue = memo.value;
  try {
    return oldValue !== (memo.value = memo.fn());
  } catch (error) {
    memo.value = error;
    memo.flags |= HasError;
    return true;
  } finally {
    activeSub = prevSub;
    memo.flags &= ~RecursedCheck;
    purgeDeps(memo);
  }
}

/** Calls the `notify` callback of each watcher that the last propagation reached. */
function deliverNotifications(): void {
  // a callback could notify another signal, which appends to the same list
  for (let i = 0; i < notifiedLength; i++) {
    const watcher = notified[i]!;
    notified[i] = undefined;
    watcher._notify();
  }
  notifiedLength = 0;
}

function scheduleRelease(memo: MemoNode): void {
  if (memo.queued || memo.depsTail === undefined) return;
  memo.queued = true;
  releaseQueue.push(memo);
  if (!releaseScheduled) {
    releaseScheduled = true;
    queueMicrotask(releaseUnobservedMemos);
  }
}

function releaseUnobservedMemos(): void {
  const queue = releaseQueue;
  releaseQueue = [];
  releaseScheduled = false;
  for (let i = 0; i < queue.length; i++) {
    const memo = queue[i];
    memo.queued = false;
    // something may have started depending on it since it was queued
    if (memo.subs === undefined && memo.depsTail !== undefined) {
      memo.flags = Mutable | Dirty;
      disposeDeps(memo);
    }
  }
}

/** Unlinks all of `sub`'s dependencies, last first. */
function disposeDeps(sub: ReactiveNode): void {
  let dep = sub.depsTail;
  while (dep !== undefined) {
    const prev = dep.prevDep;
    unlink(dep, sub);
    dep = prev;
  }
}

/** Unlinks the dependencies after `depsTail`, which the latest run did not read. */
function purgeDeps(sub: ReactiveNode): void {
  const depsTail = sub.depsTail;
  let dep = depsTail !== undefined ? depsTail.nextDep : sub.deps;
  while (dep !== undefined) {
    dep = unlink(dep, sub);
  }
}
