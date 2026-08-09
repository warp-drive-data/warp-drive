import { RequestManager } from '@warp-drive/core';
import { createRequestSubscription } from '@warp-drive/core/reactive';
import { DISPOSE } from '@warp-drive/core/signals/-leaked';
import { module, test } from '@warp-drive/diagnostic';

// Regression coverage for https://github.com/warp-drive-data/warp-drive/issues/10428
//
// Non-DOM environments (e.g. React Native) may provide a `window` global
// that lacks `addEventListener`/`removeEventListener`, and a `document`
// that either doesn't exist at all or lacks the event/visibility APIs used
// here. `RequestSubscription` (which powers the `<Request />` component's
// autorefresh/retry/refresh behaviors) must not throw when installing or
// tearing down its network/visibility listeners in such environments.
//
// Real browsers do not allow redefining the global `window.document`
// binding itself (it is a non-configurable own property of `window`), so
// this test simulates the failure mode reported in the issue - `window`
// and `document` present but missing the specific APIs we depend on - by
// shadowing just those APIs for the duration of the test.
module('Integration | signals | RequestSubscription in non-DOM environments', function () {
  test('creating and disposing a RequestSubscription does not throw when window/document lack the expected browser APIs', function (assert) {
    const originalWindowAddEventListener = window.addEventListener.bind(window);
    const originalWindowRemoveEventListener = window.removeEventListener.bind(window);
    const originalDocumentAddEventListener = document.addEventListener.bind(document);
    const originalDocumentRemoveEventListener = document.removeEventListener.bind(document);
    const originalVisibilityState = document.visibilityState;

    Object.defineProperty(window, 'addEventListener', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'removeEventListener', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(document, 'addEventListener', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(document, 'removeEventListener', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(document, 'visibilityState', { value: undefined, configurable: true, writable: true });

    try {
      const manager = new RequestManager();
      let subscription: ReturnType<typeof createRequestSubscription> | undefined;

      assert.doesNotThrow(() => {
        subscription = createRequestSubscription(manager, {});
      }, 'constructing a RequestSubscription does not throw');

      assert.true(subscription!.isOnline, 'defaults to online when window.navigator is unavailable');
      assert.false(subscription!.isHidden, 'defaults to visible when document.visibilityState is unavailable');

      assert.doesNotThrow(() => {
        subscription![DISPOSE]();
      }, 'disposing a RequestSubscription does not throw');
    } finally {
      Object.defineProperty(window, 'addEventListener', {
        value: originalWindowAddEventListener,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'removeEventListener', {
        value: originalWindowRemoveEventListener,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(document, 'addEventListener', {
        value: originalDocumentAddEventListener,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(document, 'removeEventListener', {
        value: originalDocumentRemoveEventListener,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(document, 'visibilityState', {
        value: originalVisibilityState,
        configurable: true,
        writable: true,
      });
    }
  });

  test('a RequestSubscription still tracks isOnline/isHidden via window/document in a normal DOM environment', function (assert) {
    const manager = new RequestManager();
    const subscription = createRequestSubscription(manager, {});

    assert.equal(subscription.isOnline, window.navigator.onLine, 'isOnline reflects window.navigator.onLine');
    assert.equal(
      subscription.isHidden,
      document.visibilityState === 'hidden',
      'isHidden reflects document.visibilityState'
    );

    assert.doesNotThrow(() => {
      subscription[DISPOSE]();
    }, 'disposing a RequestSubscription does not throw');
  });
});
