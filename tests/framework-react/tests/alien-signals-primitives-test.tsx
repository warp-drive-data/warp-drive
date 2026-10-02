import {
  consumeSignal,
  createMemo,
  createSignal,
  hasSubscribers,
  isTracking,
  type MemoNode,
  notifySignal,
  readMemo,
  Watcher,
} from "@warp-drive/alien-signals/primitives";
import { DEBUG } from "@warp-drive/core/build-config/env";
import { module, test } from "@warp-drive/diagnostic/react";

module("Unit | @warp-drive/alien-signals | primitives", function () {
  test("memos cache their result until a signal they read is notified", function (assert) {
    const owner = {};
    const a = createSignal(owner, "a");
    const b = createSignal(owner, "b");
    let aValue = 1;
    let runs = 0;
    const sum = createMemo(owner, "sum", () => {
      runs++;
      consumeSignal(a);
      consumeSignal(b);
      return aValue + 2;
    });
    const double = createMemo(owner, "double", () => {
      assert.true(isTracking(), "reads inside a memo are tracked");
      return readMemo(sum) * 2;
    });

    assert.equal(readMemo(double), 6, "computes on first read");
    assert.equal(readMemo(double), 6, "returns the cached result");
    assert.equal(runs, 1, "does not recompute while nothing changed");

    aValue = 10;
    notifySignal(a);
    assert.equal(readMemo(double), 24, "recomputes after a signal it read is notified");
    assert.equal(runs, 2, "recomputes once");
    assert.false(isTracking(), "reads outside of a memo are not tracked");
  });

  test("a memo whose result is unchanged does not recompute its dependents", function (assert) {
    const owner = {};
    const signal = createSignal(owner, "s");
    let dependentRuns = 0;
    const constant = createMemo(owner, "constant", () => {
      consumeSignal(signal);
      return 0;
    });
    const dependent = createMemo(owner, "dependent", () => {
      dependentRuns++;
      return readMemo(constant);
    });
    const watcher = new Watcher(() => {});
    watcher.watch(dependent);

    readMemo(dependent);
    notifySignal(signal);
    readMemo(dependent);
    assert.equal(dependentRuns, 1, "dependent did not recompute");
    watcher.unwatchAll();
  });

  test("a Watcher is notified once per change until it is re-armed", function (assert) {
    const owner = {};
    const a = createSignal(owner, "a");
    const b = createSignal(owner, "b");
    const memo = createMemo(owner, "memo", () => {
      consumeSignal(a);
      consumeSignal(b);
      return {};
    });
    const watcher = new Watcher(() => assert.step("notified"));

    watcher.watch(memo);
    watcher.watch(memo);
    assert.equal(watcher.watched.size, 1, "watching twice watches once");
    readMemo(memo);

    notifySignal(a);
    notifySignal(b);
    assert.verifySteps(["notified"], "notified once for two changes");
    assert.true(watcher.isNotified, "reports that it was notified");

    watcher.rearm();
    readMemo(memo);
    notifySignal(b);
    assert.verifySteps(["notified"], "notified again after re-arming");

    const direct = createSignal(owner, "direct");
    watcher.rearm();
    watcher.watch(direct);
    notifySignal(direct);
    assert.verifySteps(["notified"], "notified by a directly watched signal");
    watcher.unwatchAll();
  });

  test("a Watcher reports what is pending since it was last re-armed", function (assert) {
    const owner = {};
    const signal = createSignal(owner, "s");
    const direct = createSignal(owner, "direct");
    const memo = createMemo(owner, "memo", () => {
      consumeSignal(signal);
      return {};
    });
    const watcher = new Watcher(() => {});
    watcher.watch(memo);
    watcher.watch(direct);
    readMemo(memo);
    assert.deepEqual(watcher.getPending(), [], "nothing is pending before a change");

    notifySignal(signal);
    notifySignal(direct);
    assert.deepEqual(
      watcher.getPending(),
      DEBUG ? [memo, direct] : [memo],
      DEBUG ? "reports the memo due to recompute and the notified signal" : "reports the memo due to recompute"
    );

    watcher.rearm();
    readMemo(memo);
    assert.deepEqual(watcher.getPending(), [], "nothing is pending after re-arming and reading");
    watcher.unwatchAll();
  });

  test("unwatchAll releases memos that nothing else depends on", function (assert) {
    const owner = {};
    const signal = createSignal(owner, "s");
    const memo = createMemo(owner, "memo", () => {
      consumeSignal(signal);
      return 1;
    });
    const watcher = new Watcher(() => assert.step("notified"));
    watcher.watch(memo);
    readMemo(memo);
    assert.true(hasSubscribers(signal), "the watched memo depends on the signal");

    watcher.unwatchAll();
    assert.false(hasSubscribers(memo), "the watcher no longer depends on the memo");
    assert.false(hasSubscribers(signal), "the memo released the signal");
    notifySignal(signal);
    assert.verifySteps([], "the watcher is not notified");
    assert.equal(readMemo(memo), 1, "the memo still computes");
  });

  test("a memo with no subscribers releases its dependencies after a microtask", async function (assert) {
    const owner = {};
    const signal = createSignal(owner, "s");
    let runs = 0;
    const memo = createMemo(owner, "memo", () => {
      runs++;
      consumeSignal(signal);
      return 1;
    });

    readMemo(memo);
    readMemo(memo);
    assert.equal(runs, 1, "memoized within the same task");
    assert.true(hasSubscribers(signal), "linked while in use");

    await Promise.resolve();
    assert.false(hasSubscribers(signal), "released, so the signal does not retain the memo");
    assert.equal(readMemo(memo), 1, "recomputes on the next read");
    assert.equal(runs, 2, "recomputed once");
  });

  test("a thrown error is cached and rethrown until a dependency changes", function (assert) {
    const owner = {};
    const signal = createSignal(owner, "s");
    let shouldThrow = true;
    let runs = 0;
    const failing = createMemo(owner, "failing", () => {
      runs++;
      consumeSignal(signal);
      if (shouldThrow) throw new Error("boom");
      return "ok";
    });
    const outer = createMemo(owner, "outer", () => readMemo(failing));
    const watcher = new Watcher(() => assert.step("notified"));
    watcher.watch(outer);

    assert.throws(() => readMemo(outer), /boom/, "throws on first read");
    assert.throws(() => readMemo(outer), /boom/, "rethrows on the next read");
    assert.equal(runs, 1, "the error is cached");

    shouldThrow = false;
    notifySignal(signal);
    assert.verifySteps(["notified"], "changes still reach the watcher");
    assert.equal(readMemo(outer), "ok", "recomputes once a dependency changes");
    watcher.unwatchAll();
  });

  test("a memo that reads itself throws", function (assert) {
    const owner = {};
    const cycle: MemoNode<number> = createMemo(owner, "cycle", () => readMemo(cycle));

    assert.throws(() => readMemo(cycle), /cycle/);
  });
});
