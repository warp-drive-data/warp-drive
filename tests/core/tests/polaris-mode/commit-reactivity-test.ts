import { settled } from '@ember/test-helpers';

import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, commit, withDefaults } from '@warp-drive/core/reactive';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

import { reactiveContext } from '../-utils/reactive-context.gts';

/**
 * Committing has to update what a *rendered* immutable record displays, not just the cache.
 *
 * These render, where the rest of the coverage for this asserts on cache contents or on
 * notifications. Both of those can pass while the DOM stays stale: a property read re-reads the
 * cache on every access, so `assert.equal(user.firstName, 'Christopher')` tells you nothing about
 * whether anything was invalidated. Rendering is the only layer that answers the question a
 * consumer actually has.
 *
 * The remote-push control is load-bearing. Without it, a harness mistake -- forgetting to await a
 * rerender is the easy one -- looks exactly like the bug these tests are here to catch.
 */

interface User {
  id: string | null;
  $type: 'user';
  firstName: string;
  [key: string]: unknown;
}

interface EditableUser extends User {
  firstName: string;
}

module('Reactivity | committing updates a rendered immutable record', function (hooks) {
  setupRenderingTest(hooks);

  /** A store whose handler echoes the request body back -- the "server agreed with us" case. */
  function setup(response?: unknown) {
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [
        {
          request({ request }: { request: { body?: unknown } }) {
            return Promise.resolve(response === undefined ? JSON.parse(request.body as string) : response);
          },
        },
      ],
    });
    const store = new Store();
    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [{ name: 'firstName', kind: 'field' }],
      })
    );
    return store;
  }

  async function renderUser(store: ReturnType<typeof setup>) {
    const resource = store.schema.resource({ type: 'user' });
    const user = store.push({
      data: { type: 'user', id: '1', attributes: { firstName: 'Chris' } },
    }) as User;
    await reactiveContext(user, resource);
    return user;
  }

  test('control: a remote push updates the DOM', async function (assert) {
    const store = setup();
    await renderUser(store);
    assert.true(this.element.textContent.includes('Chris'), 'DOM starts at Chris');

    store.push({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } } });
    await settled();

    const text = this.element.textContent;
    assert.true(text.includes('Christopher'), `DOM updated (text="${text.trim()}")`);
  });

  test('commit() updates the DOM', async function (assert) {
    const store = setup();
    const user = await renderUser(store);
    assert.true(this.element.textContent.includes('Chris'), 'DOM starts at Chris');

    const editable = await checkout<EditableUser>(user);
    editable.firstName = 'Christopher';
    await commit(editable);
    await settled();

    const text = this.element.textContent;
    assert.true(text.includes('Christopher'), `DOM shows the committed value (text="${text.trim()}")`);
  });

  test('a save whose response echoes the saved value updates the DOM', async function (assert) {
    const store = setup();
    const user = await renderUser(store);
    const editable = await checkout<EditableUser>(user);
    editable.firstName = 'Christopher';

    await store.request({
      op: 'updateRecord',
      url: '/users/1',
      method: 'PUT',
      body: JSON.stringify({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } } }),
      records: [recordIdentifierFor(editable)],
    });
    await settled();

    const text = this.element.textContent;
    assert.true(text.includes('Christopher'), `DOM shows the saved value (text="${text.trim()}")`);
  });

  test('a save with an empty response updates the DOM', async function (assert) {
    const store = setup({ data: null });
    const user = await renderUser(store);
    const editable = await checkout<EditableUser>(user);
    editable.firstName = 'Christopher';

    await store.request({
      op: 'updateRecord',
      url: '/users/1',
      method: 'PUT',
      body: JSON.stringify({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } } }),
      records: [recordIdentifierFor(editable)],
    });
    await settled();

    const text = this.element.textContent;
    assert.true(text.includes('Christopher'), `DOM shows the saved value (text="${text.trim()}")`);
  });
});
