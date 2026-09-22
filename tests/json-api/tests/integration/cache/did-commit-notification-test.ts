import type { NotificationType, Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, commit, withDefaults } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { StructuredDataDocument } from '@warp-drive/core/types/request';
import type { SingleResourceDataDocument } from '@warp-drive/core/types/spec/document';
import type { ExistingResourceObject } from '@warp-drive/core/types/spec/json-api-raw';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import type { TestContext } from '@warp-drive/diagnostic/-types';
import { MockServerHandler } from '@warp-drive/holodeck';
import { PATCH } from '@warp-drive/holodeck/mock';
import { JSONAPICache } from '@warp-drive/json-api';
import { buildBaseURL } from '@warp-drive/utilities';

/**
 * Each test watches three subscribers so the whole delivery matrix is visible rather than half
 * of it: the remote channel, the local channel from the start (which also sees the `setAttr` from
 * the edit), and the local channel subscribed after the edit (which sees only what the commit or
 * save itself emits).
 *
 * Assert on notifications here, never on a subsequent property read: outside a tracking frame a
 * getter re-reads the cache every time, so reading the value back passes whether or not anything
 * was notified.
 */

// a type alias, not an interface: attribute values need an implicit index signature to satisfy
// the cache's `Value` type
type Message = { id: string; state: string };

interface ExistingUser {
  [Type]: 'user';
  id: string;
  firstName: string;
  lastName: string;
  messages: Message[];
}

interface CustomContext extends TestContext {
  store: Store;
}

function flush(store: Store): void {
  (store.notifications as unknown as { _flush: () => void })._flush();
}

/** Records the `attributes` keys delivered to a subscriber on the given channel. */
function watch(store: Store, record: unknown, channel: 'local' | 'remote'): string[] {
  const keys: string[] = [];
  store.notifications.subscribe(
    recordIdentifierFor(record as object),
    (_cacheKey: ResourceKey, type: NotificationType, key?: string | null) => {
      if (type === 'attributes') keys.push(String(key));
    },
    channel
  );
  return keys;
}

/**
 * A save response to hand straight to `cache.didCommit`. The `Cache` interface types the result's
 * `content.data` as a `PersistedResourceKey`, but `JSONAPICache.didCommit` reads it as the raw
 * resource object, which is what this builds; the cast bridges that gap in one place.
 */
function saveResponse(data: ExistingResourceObject): StructuredDataDocument<SingleResourceDataDocument> {
  return {
    request: {},
    response: null,
    content: { data },
  } as unknown as StructuredDataDocument<SingleResourceDataDocument>;
}

function pushUser(store: Store, messages: Message[] = []): ExistingUser {
  store.push({
    data: {
      type: 'user',
      id: '1',
      attributes: { firstName: 'Chris', lastName: 'Thoburn', messages },
    },
  });
  return store.peekRecord<ExistingUser>('user', '1')!;
}

module<CustomContext>('Integration | <JSONAPICache>.didCommit notifications', function (hooks) {
  hooks.beforeEach(function () {
    const TestStore = useRecommendedStore({
      handlers: [new MockServerHandler(this)],
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { name: 'firstName', kind: 'field' },
            { name: 'lastName', kind: 'field' },
            { name: 'messages', kind: 'schema-array', type: 'message' },
          ],
        }),
        {
          type: 'message',
          identity: null,
          fields: [
            { name: 'id', kind: 'field' },
            { name: 'state', kind: 'field' },
          ],
        },
      ],
    });
    this.store = new TestStore();
  });

  test<CustomContext>('control: a remote push reaches a remote subscriber', function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const remote = watch(store, user, 'remote');

    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Christopher', lastName: 'Thoburn', messages: [] },
      },
    });
    flush(store);

    assert.true(remote.includes('firstName'), `remote heard the push (saw ${remote.join()})`);
  });

  test<CustomContext>('control: a local edit reaches a local subscriber and not a remote one', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);

    assert.deepEqual(local, ['firstName'], 'local heard the edit');
    assert.deepEqual(remote, [], 'remote did not hear the edit');
  });

  test<CustomContext>('commit() notifies the remote channel for a promoted top-level field', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);
    assert.deepEqual(remote, [], 'the local edit alone does not reach the remote channel');

    const localAfterEdit = watch(store, user, 'local');
    await commit(editable);
    flush(store);

    assert.deepEqual(remote, ['firstName'], 'commit notified remote for the promoted key');
    // the local projection read this value out of localAttrs before the commit and out of
    // remoteAttrs after it -- same value either way -- so the commit must not invalidate it
    assert.deepEqual(localAfterEdit, [], 'commit emitted nothing on the local channel');
    assert.deepEqual(localAll, ['firstName'], 'the only local notification came from the edit');
  });

  test<CustomContext>('commit() notifies the remote channel for a promoted schema-array field', async function (assert) {
    const { store } = this;
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    flush(store);
    assert.deepEqual(remote, [], 'the nested local edit alone does not reach the remote channel');

    const localAfterEdit = watch(store, user, 'local');
    await commit(editable);
    flush(store);

    // a nested write is notified under its top-level cache key
    assert.deepEqual(remote, ['messages'], 'commit notified remote for the promoted nested key');
    assert.deepEqual(localAfterEdit, [], 'commit emitted nothing on the local channel');
    assert.deepEqual(localAll, ['messages'], 'the only local notification came from the edit');
  });

  test<CustomContext>('commit() does not notify for a value that did not actually change', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    // assign the value the remote projection already holds
    editable.firstName = 'Chris';
    const localAfterEdit = watch(store, user, 'local');
    await commit(editable);
    flush(store);

    assert.deepEqual(remote, [], 'a no-op commit stays silent on the remote channel');
    assert.deepEqual(localAfterEdit, [], 'a no-op commit stays silent on the local channel');
  });

  test<CustomContext>('a save with a 204 response notifies the remote channel', async function (assert) {
    const { store } = this;
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);
    const localAfterEdit = watch(store, user, 'local');

    const body = JSON.stringify({
      data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } },
    });
    await PATCH(this, '/api/user/1', () => ({ data: null }), { body });

    await store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );
    flush(store);

    assert.deepEqual(remote, ['firstName'], 'remote heard the saved key despite an empty response');
    assert.deepEqual(localAfterEdit, [], 'the save emitted nothing on the local channel');
    assert.deepEqual(localAll, ['firstName'], 'the only local notification came from the edit');
  });

  test<CustomContext>('a save whose response echoes the saved value verbatim notifies the remote channel', async function (assert) {
    const { store } = this;
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);
    const localAfterEdit = watch(store, user, 'local');

    const body = JSON.stringify({
      data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } },
    });
    await PATCH(
      this,
      '/api/user/1',
      () => ({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher', lastName: 'Thoburn' } } }),
      { body }
    );

    await store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );
    flush(store);

    // `changedKeys` is empty here -- the server agreed with what we sent -- but the remote
    // projection still moved from 'Chris' to 'Christopher'
    assert.true(remote.includes('firstName'), `remote heard the saved key (saw ${remote.join()})`);
    assert.deepEqual(localAfterEdit, [], 'the save emitted nothing on the local channel');
  });

  test<CustomContext>('a save with a sparse response notifies the remote channel for the omitted keys', async function (assert) {
    const { store } = this;
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    editable.lastName = 'Thoburn-Smith';
    flush(store);
    const localAfterEdit = watch(store, user, 'local');

    const body = JSON.stringify({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Christopher', lastName: 'Thoburn-Smith' },
      },
    });
    // the server echoes only firstName
    await PATCH(
      this,
      '/api/user/1',
      () => ({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } } }),
      { body }
    );

    await store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );
    flush(store);

    assert.true(remote.includes('firstName'), `remote heard the echoed key (saw ${remote.join()})`);
    assert.true(remote.includes('lastName'), `remote heard the omitted-but-saved key (saw ${remote.join()})`);
    assert.deepEqual(localAfterEdit, [], 'the save emitted nothing on the local channel');
  });

  test<CustomContext>('a save whose response differs from what was sent notifies unscoped, and only once', async function (assert) {
    const { store } = this;
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);
    const localAfterEdit = watch(store, user, 'local');

    const body = JSON.stringify({
      data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } },
    });
    // the server normalizes the value to something else entirely
    await PATCH(
      this,
      '/api/user/1',
      () => ({ data: { type: 'user', id: '1', attributes: { firstName: 'CHRISTOPHER' } } }),
      { body }
    );

    await store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );
    flush(store);

    // a server-driven difference lands in `changedKeys` and notifies unscoped, since both
    // projections changed. One delivery per channel -- the notification buffer coalesces by key
    // within a flush window, so this holds however many notifies fired for that key.
    assert.deepEqual(remote, ['firstName'], 'remote heard it exactly once');
    assert.deepEqual(localAfterEdit, ['firstName'], 'local heard the save exactly once');
    assert.deepEqual(localAll, ['firstName', 'firstName'], 'local heard the edit and then the save');
  });

  // the nested-field counterpart, which needs structural equality to hold, is in structural-equality-test.ts
  test<CustomContext>('a remote push that confirms an uncommitted local edit notifies the remote channel only', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);
    assert.deepEqual(remote, [], 'the local edit alone does not reach the remote channel');

    // the push landing exactly on the edit's value is what previously pruned the notification
    const localAfterEdit = watch(store, user, 'local');
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Christopher', lastName: 'Thoburn', messages: [] },
      },
    });
    flush(store);

    assert.deepEqual(remote, ['firstName'], 'remote heard the confirming push');
    assert.deepEqual(localAfterEdit, [], 'the push emitted nothing on the local channel');
    assert.deepEqual(localAll, ['firstName'], 'the only local notification came from the edit');
    assert.false(store.cache.hasChangedAttrs(lid), 'the confirmed edit is no longer dirty');
    assert.equal(editable.firstName, 'Christopher', 'the editable copy reads the confirmed value');
    assert.equal(user.firstName, 'Christopher', 'the immutable record reads the confirmed value');
  });

  test<CustomContext>('a remote push that lands under a diverging local edit notifies the remote channel only and refreshes changedAttrs', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);

    const localAfterEdit = watch(store, user, 'local');
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris3', lastName: 'Thoburn', messages: [] },
      },
    });
    flush(store);

    assert.deepEqual(remote, ['firstName'], 'remote heard the diverging push');
    assert.deepEqual(localAfterEdit, [], 'the diverging push did not wake the local channel');
    assert.deepEqual(localAll, ['firstName'], 'the only local notification came from the edit');
    assert.equal(editable.firstName, 'Christopher', 'the local edit survives the diverging push');
    assert.deepEqual(
      store.cache.changedAttrs(lid).firstName,
      ['Chris3', 'Christopher'],
      'changedAttrs reflects the new remote baseline, not a stale pre-push one'
    );
  });

  test<CustomContext>('a save whose response matches an edit made while the request was in flight notifies the remote channel', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);

    store.cache.willCommit(lid, null);
    // a second local edit made while the first is in flight
    editable.firstName = 'Chris2';
    flush(store);

    const localAfterEdit = watch(store, user, 'local');
    store.cache.didCommit(lid, saveResponse({ type: 'user', id: '1', attributes: { firstName: 'Chris2' } }));
    flush(store);

    assert.deepEqual(remote, ['firstName'], 'remote heard the save land on the value the in-flight edit predicted');
    assert.deepEqual(localAfterEdit, [], 'the commit emitted nothing on the local channel');
    assert.true(localAll.includes('firstName'), `local heard the two edits (saw ${localAll.join()})`);
    assert.equal(editable.firstName, 'Chris2', 'the editable copy reads the committed value');
    assert.equal(user.firstName, 'Chris2', 'the immutable record reads the committed value');
  });

  test<CustomContext>('a remote push that lands under an in-flight save does not wake the local channel', async function (assert) {
    const { store } = this;
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');
    const localAll = watch(store, user, 'local');

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    flush(store);

    store.cache.willCommit(lid, null);

    const localAfterWillCommit = watch(store, user, 'local');
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris3', lastName: 'Thoburn', messages: [] },
      },
    });
    flush(store);

    assert.deepEqual(remote, ['firstName'], 'remote heard the push land under the in-flight save');
    assert.deepEqual(localAfterWillCommit, [], 'the push did not wake the local channel');
    assert.equal(editable.firstName, 'Christopher', 'local still reads the in-flight value, not the push');

    store.cache.didCommit(lid, saveResponse({ type: 'user', id: '1', attributes: { firstName: 'Christopher' } }));
    flush(store);

    assert.deepEqual(remote, ['firstName', 'firstName'], 'remote heard the commit resolve Chris3 into Christopher');
    assert.deepEqual(localAll, ['firstName'], 'the only local notification came from the initial edit');
    assert.equal(user.firstName, 'Christopher', 'the immutable record reads the committed value');
  });
});
