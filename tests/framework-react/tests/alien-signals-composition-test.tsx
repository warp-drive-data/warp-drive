import {
  buildSignalConfig,
  type ComposingSignalHooks,
  type SignalIntegration,
} from "@warp-drive/alien-signals/install";
import { hasSubscribers, type MemoNode, type SignalNode } from "@warp-drive/alien-signals/primitives";
import { module, test } from "@warp-drive/diagnostic/react";

const options = { wellknown: { Array: "[]" } };

interface FakeSignal {
  key: string;
  notified: number;
}

/**
 * A stand-in for a framework that brings its own signals, such as Ember: a signal consumed while
 * `track` runs is recorded in that frame, and reads outside of any frame are not tracked. Each
 * signal it creates is kept by key, so a test can check whether it was notified.
 */
function setupForeignFramework(hooks: ComposingSignalHooks) {
  let frame: string[] | null = null;
  let untrackedReads = 0;
  const created = new Map<string, FakeSignal>();
  hooks.register((): SignalIntegration<FakeSignal> => ({
    createSignal: (_obj, key) => {
      const signal = { key: String(key), notified: 0 };
      created.set(signal.key, signal);
      return signal;
    },
    consumeSignal: (signal) => {
      if (frame) frame.push(signal.key);
      else untrackedReads++;
    },
    notifySignal: (signal) => {
      signal.notified++;
    },
    isTracking: () => frame !== null,
  }));

  return {
    track(fn: () => unknown): string[] {
      const parent = frame;
      const consumed: string[] = [];
      frame = consumed;
      try {
        fn();
      } finally {
        frame = parent;
      }
      return consumed;
    },
    signal(key: string): FakeSignal | undefined {
      return created.get(key);
    },
    get untrackedReads() {
      return untrackedReads;
    },
  };
}

module("Unit | @warp-drive/alien-signals | install composition", function () {
  test("a framework with its own signals sees a memo as one signal of its own", function (assert) {
    const hooks = buildSignalConfig(options);
    const framework = setupForeignFramework(hooks);
    const owner = {};
    const a = hooks.createSignal(owner, "a");
    const b = hooks.createSignal(owner, "b");
    let runs = 0;
    const memo = hooks.createMemo(owner, "memo", () => {
      runs++;
      hooks.consumeSignal(a);
      hooks.consumeSignal(b);
      return runs;
    });

    assert.deepEqual(
      framework.track(memo),
      ["memo", "a", "b"],
      "the first read consumes the memo's signal, then the signals the memo reads as it runs"
    );
    assert.deepEqual(framework.track(memo), ["memo"], "a cached read consumes only the memo's signal");
    assert.equal(runs, 1, "the cached read did not run the memo");

    hooks.notifySignal(a);
    assert.equal(framework.signal("memo")?.notified, 1, "the memo's signal is notified when a signal it read is");
    assert.deepEqual(framework.track(memo), ["memo", "a", "b"], "the next read runs the memo again");
    assert.equal(runs, 2, "the memo recomputed after its signal was notified");
  });

  test("a memo's signal is notified when a memo it read changes", function (assert) {
    const hooks = buildSignalConfig(options);
    const framework = setupForeignFramework(hooks);
    const owner = {};
    const a = hooks.createSignal(owner, "a");
    const b = hooks.createSignal(owner, "b");
    const inner = hooks.createMemo(owner, "inner", () => {
      hooks.consumeSignal(a);
      return 1;
    });
    const outer = hooks.createMemo(owner, "outer", () => {
      hooks.consumeSignal(b);
      return inner() + inner();
    });

    framework.track(inner);
    assert.deepEqual(
      framework.track(outer),
      ["outer", "b"],
      "a memo read by another memo does not consume its own signal; the outer memo's covers it"
    );
    assert.deepEqual(framework.track(outer), ["outer"], "a cached outer memo consumes only its own signal");

    hooks.notifySignal(a);
    assert.equal(framework.signal("outer")?.notified, 1, "the outer memo's signal is notified");
    assert.equal(framework.signal("inner")?.notified, 1, "the inner memo's signal, read directly earlier, is notified");
  });

  test("a memo read outside of tracking gets no signal of its own", function (assert) {
    const hooks = buildSignalConfig(options);
    const framework = setupForeignFramework(hooks);
    const owner = {};
    const a = hooks.createSignal(owner, "a");
    const memo = hooks.createMemo(owner, "memo", () => {
      hooks.consumeSignal(a);
      return 1;
    });

    memo();
    memo();
    assert.equal(framework.untrackedReads, 1, "only the first read ran the memo and consumed its signal");
    assert.equal(framework.signal("memo"), undefined, "no signal was created for the memo");
  });

  test("a memo's signal is notified once per read, and releases the memo between reads", function (assert) {
    const hooks = buildSignalConfig(options);
    const framework = setupForeignFramework(hooks);
    const owner = {};
    const a = hooks.createSignal(owner, "a");
    const memo = hooks.createMemo(owner, "memo", () => {
      hooks.consumeSignal(a);
      return 1;
    });

    framework.track(memo);
    hooks.notifySignal(a);
    assert.equal(framework.signal("memo")?.notified, 1, "notified after the first change");
    assert.false(hasSubscribers(a), "the memo released the signals it read once nothing watched it");

    hooks.notifySignal(a);
    assert.equal(framework.signal("memo")?.notified, 1, "not notified again until the memo is read again");

    framework.track(memo);
    hooks.notifySignal(a);
    assert.equal(framework.signal("memo")?.notified, 2, "notified again after the memo was read again");
  });

  test("every framework with its own signals gets its own signal for a memo", function (assert) {
    const hooks = buildSignalConfig(options);
    const first = setupForeignFramework(hooks);
    const second = setupForeignFramework(hooks);
    const owner = {};
    const a = hooks.createSignal(owner, "a");
    const memo = hooks.createMemo(owner, "memo", () => {
      hooks.consumeSignal(a);
      return 1;
    });

    assert.deepEqual(first.track(memo), ["memo", "a"], "the first framework tracks the memo's signal");
    assert.deepEqual(second.track(memo), ["memo"], "the second framework tracks its own signal for the memo");

    hooks.notifySignal(a);
    assert.equal(first.signal("memo")?.notified, 1, "the first framework's signal was notified");
    assert.equal(second.signal("memo")?.notified, 1, "the second framework's signal was notified");
    assert.equal(first.signal("a")?.notified, 1, "the first framework's signal for `a` was notified");
    assert.equal(second.signal("a")?.notified, 1, "the second framework's signal for `a` was notified");
  });

  test("notifying a signal notifies the signal each framework created for it", function (assert) {
    const hooks = buildSignalConfig(options);
    let created: FakeSignal | undefined;
    hooks.register((): SignalIntegration<FakeSignal> => ({
      createSignal: (_obj, key) => (created = { key: String(key), notified: 0 }),
      notifySignal: (signal) => {
        signal.notified++;
      },
    }));
    const signal = hooks.createSignal({}, "a");

    hooks.notifySignal(signal);
    assert.equal(created?.notified, 1, "the framework's signal was notified");
  });

  test("a framework without its own signals observes the graph's signals and memos", function (assert) {
    const hooks = buildSignalConfig(options);
    const consumed: Array<SignalNode | MemoNode> = [];
    const notified: SignalNode[] = [];
    hooks.register((): SignalIntegration => ({
      consumeSignal: (signal) => consumed.push(signal),
      notifySignal: (signal) => notified.push(signal),
      consumeMemo: (memo) => consumed.push(memo),
    }));
    const signal = hooks.createSignal({}, "a");
    const memo = hooks.createMemo({}, "memo", () => {
      hooks.consumeSignal(signal);
      return 1;
    });

    memo();
    assert.equal(consumed.length, 2, "the memo and the signal it read were consumed");
    assert.true("fn" in consumed[0], "the memo was consumed before it ran");
    assert.equal(consumed[1], signal, "the graph's own signal was consumed");
    hooks.notifySignal(signal);
    assert.deepEqual(notified, [signal], "the graph's own signal was notified");
  });

  test("willSyncFlushWatchers and waitFor combine every registered framework's", async function (assert) {
    const hooks = buildSignalConfig(options);
    assert.false(hooks.willSyncFlushWatchers(), "nothing registered never flushes synchronously");
    let flushes = false;
    hooks.register(() => ({ willSyncFlushWatchers: () => false }));
    hooks.register(() => ({
      willSyncFlushWatchers: () => flushes,
      waitFor: (promise) => {
        assert.step("first waitFor");
        return promise;
      },
    }));
    hooks.register(() => ({
      waitFor: (promise) => {
        assert.step("second waitFor");
        return promise;
      },
    }));

    assert.false(hooks.willSyncFlushWatchers(), "no framework flushes synchronously");
    flushes = true;
    assert.true(hooks.willSyncFlushWatchers(), "one framework flushes synchronously");
    assert.equal(await hooks.waitFor!(Promise.resolve(1)), 1, "waitFor resolves to the promise's value");
    assert.verifySteps(["first waitFor", "second waitFor"]);
  });

  test("a framework with its own signals cannot register after signals were created", function (assert) {
    const hooks = buildSignalConfig(options);
    hooks.createSignal({}, "a");

    assert.throws(() => {
      hooks.register(() => ({ createSignal: () => ({}) }));
    }, /Cannot register signal hooks that create their own signals after WarpDrive has created signals/);
    hooks.register(() => ({ consumeMemo: () => {} }));
    assert.ok(true, "a framework that observes the graph can still register");
  });
});
