import { setOwner } from '@ember/owner';

import { useRecommendedStore } from '@warp-drive/core';
import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

module('WarpDrive | store.request | controller', function (hooks) {
  setupTest(hooks);

  test('aborting a controller passed to store.request aborts the request', async function (assert) {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | null = null;

    const handler: Handler = {
      request<T>(context: RequestContext, _next: NextFn<T>): Promise<T> {
        const { signal } = context.request;
        receivedSignal = signal ?? null;
        assert.equal(signal, controller.signal, 'the handler receives the signal of the controller we passed');
        assert.false('controller' in context.request, 'the handler does not receive the controller itself');

        return new Promise<T>((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(signal!.reason as Error), { once: true });
        });
      },
    };
    const AppStore = useRecommendedStore({ cache: JSONAPICache, handlers: [handler] });
    const store = new AppStore();
    setOwner(store, this.owner);

    const future = store.request({ url: '/api/users/1', method: 'GET', controller });
    controller.abort();

    try {
      await future;
      assert.ok(false, 'aborting the controller should result in the request rejecting');
    } catch (e) {
      assert.true(e instanceof Error, 'the request rejects with an error');
      assert.equal((e as Error).name, 'AbortError', 'the error is an AbortError');
    }
    assert.true(receivedSignal!.aborted, 'the signal the handler received is aborted');
  });
});
