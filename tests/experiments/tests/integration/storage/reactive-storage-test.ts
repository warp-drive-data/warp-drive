import { module, test } from '@warp-drive/diagnostic';
import { getSessionStorage } from '@warp-drive/experiments/storage';

/** A fresh, collision-free key per test so tests never share storage state. */
function freshKey(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

module('Unit | storage | ReactiveStorage', function () {
  test('getItem returns null for a key that was never set', function (assert) {
    const storage = getSessionStorage();
    assert.equal(storage.getItem(freshKey('unset')), null);
  });

  test('setItem/getItem round-trip', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('roundtrip');
    storage.setItem(key, 'hello');
    assert.equal(storage.getItem(key), 'hello');
  });

  test('removeItem clears a key', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('remove');
    storage.setItem(key, 'value');
    storage.removeItem(key);
    assert.equal(storage.getItem(key), null);
  });

  test('setItem with an unchanged value is a no-op', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('noop');
    storage.setItem(key, 'same');
    const lengthBefore = storage.length;
    storage.setItem(key, 'same');
    assert.equal(storage.length, lengthBefore);
    assert.equal(storage.getItem(key), 'same');
  });

  test('caches reads in memory — a raw external write is not seen until a storage event fires', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('stale-cache');

    storage.setItem(key, 'original');
    // Prime the in-memory cache.
    assert.equal(storage.getItem(key), 'original');

    // Mutate the real underlying sessionStorage directly, bypassing the
    // reactive wrapper entirely — this is exactly what a raw
    // `sessionStorage.clear()` does, and why it doesn't reliably reset
    // state backed by this wrapper.
    sessionStorage.setItem(key, 'changed-behind-its-back');

    assert.equal(storage.getItem(key), 'original', 'the cached value is returned, not the raw storage value');
  });

  test('a dispatched storage event updates the cached value', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('cross-tab');

    storage.setItem(key, 'before');
    assert.equal(storage.getItem(key), 'before');

    window.dispatchEvent(
      new StorageEvent('storage', {
        storageArea: sessionStorage,
        key,
        oldValue: 'before',
        newValue: 'after',
      })
    );

    assert.equal(storage.getItem(key), 'after');
  });

  test('key(index) returns keys by insertion-independent index within bounds', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('indexed');
    storage.setItem(key, 'x');

    const index = storage.length - 1;
    const found = storage.key(index);
    assert.equal(typeof found, 'string');
  });

  test('length reflects the number of keys in storage', function (assert) {
    const storage = getSessionStorage();
    const before = storage.length;
    const key = freshKey('length');
    storage.setItem(key, 'x');
    assert.equal(storage.length, before + 1);
    storage.removeItem(key);
    assert.equal(storage.length, before);
  });

  // Runs last in this module (tests execute in declaration order) — clear()
  // wipes every key in sessionStorage, not just this test's own, so no test
  // after it can assume anything persisted earlier still exists. Every test
  // here only ever checks keys it created itself, so that isn't a problem.
  test('clear empties both the underlying storage and the in-memory cache', function (assert) {
    const storage = getSessionStorage();
    const key = freshKey('clear-me');
    storage.setItem(key, 'x');

    storage.clear();

    assert.equal(storage.length, 0);
    assert.equal(storage.getItem(key), null);
    assert.equal(sessionStorage.getItem(key), null);
  });
});
