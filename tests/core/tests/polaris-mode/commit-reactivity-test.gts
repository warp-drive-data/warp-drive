import { settled } from '@ember/test-helpers';
import Component from '@glimmer/component';

import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, commit, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import type { RenderingTestContext } from '@warp-drive/diagnostic/ember';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * Committing has to update what a *rendered* immutable record displays, not just the cache.
 *
 * Every test here renders both projections side by side -- `[data-test-saved]` reads the immutable
 * record, `[data-test-edits]` reads the editable checkout -- and asserts all three stages:
 *
 * | stage          | saved (remote) | edits (local) |
 * | -------------- | -------------- | ------------- |
 * | after checkout | Chris          | Chris         |
 * | after the edit | Chris          | Christopher   |  <- buffered, by design
 * | after commit   | Christopher    | Christopher   |
 *
 * The middle row is a feature, not the bug: local edits are deliberately withheld from the rest of
 * the app until committed. The bug is the third row, where the immutable projection was left on the
 * stale value. Asserting the middle row keeps a future fix from "solving" the third row by leaking
 * local edits early.
 *
 * These render because the other layers can't see this. A property read re-reads the cache on every
 * access, so `assert.equal(user.firstName, 'Christopher')` passes whether or not anything was
 * invalidated -- which is exactly why the existing coverage missed it.
 *
 * The remote-push control is load-bearing. Without it a harness mistake -- forgetting to await a
 * rerender is the easy one -- looks identical to the defect these tests exist to catch.
 */

// a type alias, not an interface: attribute values need an implicit index signature to satisfy
// the cache's `Value` type
type Message = { id: string; state: string };

interface User {
  id: string | null;
  $type: 'user';
  firstName: string;
  messages: Message[];
  [Type]: 'user';
}

type EditableUser = User;

/** Reads the full path on each render, so the nested signal is consumed rather than captured. */
class NestedRow extends Component<{ Args: { saved: User; edits: EditableUser } }> {
  get savedState(): string {
    return this.args.saved.messages[0].state;
  }
  get editsState(): string {
    return this.args.edits.messages[0].state;
  }
  <template>
    <div data-test-saved>{{this.savedState}}</div>
    <div data-test-edits>{{this.editsState}}</div>
  </template>
}

module('Reactivity | committing updates a rendered immutable record', function (hooks) {
  setupRenderingTest(hooks);

  /** `response` defaults to echoing the request body back -- the "server agreed with us" case. */
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
        fields: [
          { name: 'firstName', kind: 'field' },
          { name: 'messages', kind: 'schema-array', type: 'message' },
        ],
      })
    );
    store.schema.registerResource({
      type: 'message',
      identity: null,
      fields: [
        { name: 'id', kind: 'field' },
        { name: 'state', kind: 'field' },
      ],
    });
    return store;
  }

  function pushUser(store: ReturnType<typeof setup>, messages: Message[] = []): User {
    return store.push({
      data: { type: 'user', id: '1', attributes: { firstName: 'Chris', messages } },
    });
  }

  function saveRequest(editable: EditableUser) {
    return {
      op: 'updateRecord' as const,
      url: '/users/1',
      method: 'PUT' as const,
      body: JSON.stringify({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher' } } }),
      records: [recordIdentifierFor(editable)],
    };
  }

  test('control: a remote push updates both projections', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await this.render(
      <template>
        <div data-test-saved>{{user.firstName}}</div>
        <div data-test-edits>{{editable.firstName}}</div>
      </template>
    );
    assert.dom('[data-test-saved]').hasText('Chris', 'saved starts at Chris');
    assert.dom('[data-test-edits]').hasText('Chris', 'edits starts at Chris');

    store.push({ data: { type: 'user', id: '1', attributes: { firstName: 'Christopher', messages: [] } } });
    await settled();

    assert
      .dom('[data-test-saved]')
      .hasText('Christopher', 'CONTROL: a remote push reaches the rendered immutable record');
    assert.dom('[data-test-edits]').hasText('Christopher', 'CONTROL: and the editable copy, which has no local edit');
  });

  test('commit() updates the rendered immutable record', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await this.render(
      <template>
        <div data-test-saved>{{user.firstName}}</div>
        <div data-test-edits>{{editable.firstName}}</div>
      </template>
    );

    // stage 1 -- after checkout, before any edit
    assert.equal(user.firstName, 'Chris', 'remote reads Chris');
    assert.equal(editable.firstName, 'Chris', 'local reads Chris');
    assert.dom('[data-test-saved]').hasText('Chris', 'saved renders Chris');
    assert.dom('[data-test-edits]').hasText('Chris', 'edits renders Chris');

    // stage 2 -- edited, not yet committed: the edit must stay buffered
    editable.firstName = 'Christopher';
    await settled();
    assert.equal(user.firstName, 'Chris', 'remote is unchanged by the buffered edit');
    assert.equal(editable.firstName, 'Christopher', 'local reflects the edit');
    assert.dom('[data-test-saved]').hasText('Chris', 'saved still renders the persisted value');
    assert.dom('[data-test-edits]').hasText('Christopher', 'edits renders the local edit');

    // stage 3 -- committed
    await commit(editable);
    await settled();
    assert.equal(user.firstName, 'Christopher', 'remote now holds the committed value');
    assert.equal(editable.firstName, 'Christopher', 'local still reads the committed value');
    assert.dom('[data-test-saved]').hasText('Christopher', 'saved renders the committed value');
    assert.dom('[data-test-edits]').hasText('Christopher', 'edits renders the committed value');
  });

  test('commit() updates a rendered nested schema-array field', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const editable = await checkout<EditableUser>(user);

    await this.render(<template><NestedRow @saved={{user}} @edits={{editable}} /></template>);

    assert.dom('[data-test-saved]').hasText('pending', 'saved renders pending');
    assert.dom('[data-test-edits]').hasText('pending', 'edits renders pending');

    editable.messages[0].state = 'executed';
    await settled();
    assert.dom('[data-test-saved]').hasText('pending', 'saved still renders the persisted nested value');
    assert.dom('[data-test-edits]').hasText('executed', 'edits renders the nested local edit');

    await commit(editable);
    await settled();
    assert.dom('[data-test-saved]').hasText('executed', 'saved renders the committed nested value');
    assert.dom('[data-test-edits]').hasText('executed', 'edits renders the committed nested value');
  });

  test('a save whose response echoes the saved value updates the rendered immutable record', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await this.render(
      <template>
        <div data-test-saved>{{user.firstName}}</div>
        <div data-test-edits>{{editable.firstName}}</div>
      </template>
    );

    editable.firstName = 'Christopher';
    await settled();
    assert.dom('[data-test-saved]').hasText('Chris', 'saved still renders the persisted value pre-save');
    assert.dom('[data-test-edits]').hasText('Christopher', 'edits renders the local edit pre-save');

    await store.request(saveRequest(editable));
    await settled();
    assert.equal(user.firstName, 'Christopher', 'remote holds the saved value');
    assert.dom('[data-test-saved]').hasText('Christopher', 'saved renders the saved value');
    assert.dom('[data-test-edits]').hasText('Christopher', 'edits renders the saved value');
  });

  test('a save with an empty response updates the rendered immutable record', async function (this: RenderingTestContext, assert) {
    const store = setup({ data: null });
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await this.render(
      <template>
        <div data-test-saved>{{user.firstName}}</div>
        <div data-test-edits>{{editable.firstName}}</div>
      </template>
    );

    editable.firstName = 'Christopher';
    await settled();
    assert.dom('[data-test-saved]').hasText('Chris', 'saved still renders the persisted value pre-save');

    await store.request(saveRequest(editable));
    await settled();
    assert.equal(user.firstName, 'Christopher', 'remote holds the saved value');
    assert.dom('[data-test-saved]').hasText('Christopher', 'saved renders the saved value');
    assert.dom('[data-test-edits]').hasText('Christopher', 'edits renders the saved value');
  });
});
