import {
  buildSignalConfig,
  type ComposingSignalHooks,
  type SignalIntegration,
} from "@warp-drive/alien-signals/install";
import type { MemoNode, SignalNode } from "@warp-drive/alien-signals/primitives";
import { module, test } from "@warp-drive/diagnostic/react";

const options = { wellknown: { Array: "[]" } };

interface FakeSignal {
  key: string;
  notified: number;
}

/**
 * A stand-in for a framework that brings its own signals, such as Ember: a signal consumed while
 * `track` runs is recorded in that frame, and reads outside of any frame are not tracked.
 */
function setupForeignFramework(hooks: ComposingSignalHooks) {
  let frame: string[] | null = null;
  let untrackedReads = 0;
  hooks.register((): SignalIntegration<FakeSignal> => ({
    createSignal: (_obj, key) => ({ key: String(key), notified: 0 }),
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
    get untrackedReads() {
      return untrackedReads;
    },
  };
}

module("Unit | @warp-drive/alien-signals | install composition", function () {
  test("a framework with its own signals is told about the signals behind a cached memo", function (assert) {
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

    assert.deepEqual(framework.track(memo), ["a", "b"], "the first read consumes the signals it reads");
    assert.deepEqual(framework.track(memo), ["a", "b"], "a cached read consumes the same signals");
    assert.equal(runs, 1, "the cached read did not run the memo");

    hooks.notifySignal(a);
    assert.deepEqual(framework.track(memo), ["a", "b"], "a read after a change consumes the signals once");
    assert.equal(runs, 2, "the memo recomputed after its signal was notified");
  });

  test("the signals behind a cached memo read by another memo are consumed", function (assert) {
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
      ["b", "a", "a"],
      "an outer memo's first run sees the signals behind the cached inner memo"
    );
    assert.deepEqual(
      framework.track(outer),
      ["b", "a"],
      "a cached outer memo consumes the signals behind the memos it read, once each"
    );
  });

  test("the signals behind a cached memo are not consumed again outside of tracking", function (assert) {
    const hooks = buildSignalConfig(options);
    const framework = setupForeignFramework(hooks);
    const owner = {};
    const a = hooks.createSignal(owner, "a");
    const memo = hooks.createMemo(owner, "memo", () => {
      hooks.consumeSignal(a);
      return 1;
    });

    memo();
    assert.equal(framework.untrackedReads, 1, "the first read consumed the signal");
    memo();
    assert.equal(framework.untrackedReads, 1, "the cached read skipped consuming it again");
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
