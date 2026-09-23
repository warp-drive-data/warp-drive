import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, commit, withDefaults } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
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
 * Each test asserts the whole delivery matrix for a key with `assert.notifiedOn`: what the remote
 * channel heard, what the local channel heard, and what was announced unscoped (which reaches
 * both). Where a test edits first, it asserts the edit's own local notification and then clears
 * the counts, so the numbers after the commit, save, or push describe only that step.
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

function setupStore(context: TestContext): Store {
  const TestStore = useRecommendedStore({
    handlers: [new MockServerHandler(context)],
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
  return new TestStore();
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

function pushFirstName(store: Store, firstName: string): void {
  store.push({
    data: { type: 'user', id: '1', attributes: { firstName, lastName: 'Thoburn', messages: [] } },
  });
}

module('Integration | <JSONAPICache>.didCommit notifications', function () {
  test('control: a remote push reaches both channels', function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    pushFirstName(store, 'Christopher');

    // with no local edit both projections moved, so the key is announced once, unscoped
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 1, 'the push was announced unscoped');
    assert.notified(lid, 'attributes', 'firstName', 1, 'and that was the only notification for the key');
  });

  test('control: a local edit reaches the local channel and not the remote one', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';

    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'local heard the edit');
    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 0, 'remote did not hear the edit');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the edit was not announced unscoped');
  });

  test('commit() notifies the remote channel for a promoted top-level field', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'firstName',
      0,
      'the local edit alone does not reach the remote channel'
    );
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'the edit notified the local channel');
    assert.clearNotifications();

    await commit(editable);

    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 1, 'commit notified remote for the promoted key');
    // the local projection read this value out of localAttrs before the commit and out of
    // remoteAttrs after it -- same value either way -- so the commit must not invalidate it
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'commit emitted nothing on the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'commit announced nothing unscoped');
  });

  test('commit() notifies the remote channel for a promoted schema-array field', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'messages',
      0,
      'the nested local edit alone does not reach the remote channel'
    );
    // a nested write is notified under its top-level cache key
    assert.notifiedOn('local', lid, 'attributes', 'messages', 1, 'the nested edit notified the local channel');
    assert.clearNotifications();

    await commit(editable);

    assert.notifiedOn('remote', lid, 'attributes', 'messages', 1, 'commit notified remote for the promoted nested key');
    assert.notifiedOn('local', lid, 'attributes', 'messages', 0, 'commit emitted nothing on the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'messages', 0, 'commit announced nothing unscoped');
  });

  test('commit() does not notify for a value that did not actually change', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    // assign the value the remote projection already holds
    editable.firstName = 'Chris';
    assert.clearNotifications();

    await commit(editable);

    assert.notified(lid, 'attributes', 'firstName', 0, 'a no-op commit stays silent on every channel');
  });

  test('a save with a 204 response notifies the remote channel', async function (assert) {
    const store = setupStore(this);
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'the edit notified the local channel');
    assert.clearNotifications();

    const body = JSON.stringify({
      data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } },
    });
    await PATCH(this, '/api/user/1', () => ({ data: null }), { body });

    await store.request(
      withReactiveResponse<ExistingUser>({ op: 'updateRecord', url, method: 'PATCH', body, records: [lid] })
    );

    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'firstName',
      1,
      'remote heard the saved key despite an empty response'
    );
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the save emitted nothing on the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the save announced nothing unscoped');
  });

  test('a save whose response echoes the saved value verbatim notifies the remote channel', async function (assert) {
    const store = setupStore(this);
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.clearNotifications();

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

    // `changedKeys` is empty here -- the server agreed with what we sent -- but the remote
    // projection still moved from 'Chris' to 'Christopher'
    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 1, 'remote heard the saved key');
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the save emitted nothing on the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the save announced nothing unscoped');
  });

  test('a save with a sparse response notifies the remote channel for the omitted keys', async function (assert) {
    const store = setupStore(this);
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    editable.lastName = 'Thoburn-Smith';
    assert.clearNotifications();

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

    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 1, 'remote heard the echoed key');
    assert.notifiedOn('remote', lid, 'attributes', 'lastName', 1, 'remote heard the omitted-but-saved key');
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the save emitted nothing local for the echoed key');
    assert.notifiedOn('local', lid, 'attributes', 'lastName', 0, 'the save emitted nothing local for the omitted key');
  });

  test('a save whose response differs from what was sent notifies unscoped, and only once', async function (assert) {
    const store = setupStore(this);
    const url = buildBaseURL({ resourcePath: 'api/user/1' });
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'the edit notified the local channel');
    assert.clearNotifications();

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

    // a server-driven difference moves both projections, so it is announced once, unscoped,
    // rather than once per channel
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 1, 'the save was announced unscoped');
    assert.notified(lid, 'attributes', 'firstName', 1, 'and that was the only notification for the key');
  });

  // the nested-field counterpart, which needs hash equality to hold, is in hash-equality-test.ts
  test('a remote push that confirms an uncommitted local edit notifies the remote channel only', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'firstName',
      0,
      'the local edit alone does not reach the remote channel'
    );
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'the edit notified the local channel');
    assert.clearNotifications();

    // the push landing exactly on the edit's value is what previously pruned the notification
    pushFirstName(store, 'Christopher');

    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 1, 'remote heard the confirming push');
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the push emitted nothing on the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the push announced nothing unscoped');
    assert.false(store.cache.hasChangedAttrs(lid), 'the confirmed edit is no longer dirty');
    assert.equal(editable.firstName, 'Christopher', 'the editable copy reads the confirmed value');
    assert.equal(user.firstName, 'Christopher', 'the immutable record reads the confirmed value');
  });

  test('a remote push that lands under a diverging local edit notifies the remote channel only and refreshes changedAttrs', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'the edit notified the local channel');
    assert.clearNotifications();

    pushFirstName(store, 'Chris3');

    assert.notifiedOn('remote', lid, 'attributes', 'firstName', 1, 'remote heard the diverging push');
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the diverging push did not wake the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the push announced nothing unscoped');
    assert.equal(editable.firstName, 'Christopher', 'the local edit survives the diverging push');
    assert.deepEqual(
      store.cache.changedAttrs(lid).firstName,
      ['Chris3', 'Christopher'],
      'changedAttrs reflects the new remote baseline, not a stale pre-push one'
    );
  });

  test('a save whose response matches an edit made while the request was in flight notifies the remote channel', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';

    store.cache.willCommit(lid, null);
    // a second local edit made while the first is in flight
    editable.firstName = 'Chris2';
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 2, 'local heard the two edits');
    assert.clearNotifications();

    store.cache.didCommit(lid, saveResponse({ type: 'user', id: '1', attributes: { firstName: 'Chris2' } }));

    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'firstName',
      1,
      'remote heard the save land on the value the in-flight edit predicted'
    );
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the commit emitted nothing on the local channel');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'the commit announced nothing unscoped');
    assert.equal(editable.firstName, 'Chris2', 'the editable copy reads the committed value');
    assert.equal(user.firstName, 'Chris2', 'the immutable record reads the committed value');
  });

  test('a remote push that lands under an in-flight save does not wake the local channel', async function (assert) {
    const store = setupStore(this);
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 1, 'the edit notified the local channel');
    assert.clearNotifications();

    store.cache.willCommit(lid, null);

    pushFirstName(store, 'Chris3');

    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'firstName',
      1,
      'remote heard the push land under the in-flight save'
    );
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the push did not wake the local channel');
    assert.equal(editable.firstName, 'Christopher', 'local still reads the in-flight value, not the push');

    store.cache.didCommit(lid, saveResponse({ type: 'user', id: '1', attributes: { firstName: 'Christopher' } }));

    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'firstName',
      2,
      'remote heard the commit resolve Chris3 into Christopher'
    );
    assert.notifiedOn('local', lid, 'attributes', 'firstName', 0, 'the commit did not wake the local channel either');
    assert.notifiedOn('unscoped', lid, 'attributes', 'firstName', 0, 'nothing since the edit was announced unscoped');
    assert.equal(user.firstName, 'Christopher', 'the immutable record reads the committed value');
  });
});
