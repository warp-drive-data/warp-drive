import Component from '@glimmer/component';

import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveResourceState } from '@warp-drive/core/reactive';
import { checkout, commit, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import type { RenderingTestContext } from '@warp-drive/diagnostic/ember';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

interface User {
  readonly id: string | null;
  readonly $type: 'user';
  readonly $state: ReactiveResourceState;
  readonly name: string;
  readonly age: number;
  readonly bestFriend: User | null;
  readonly [Type]: 'user';
}

interface EditableUser {
  readonly id: string | null;
  readonly $type: 'user';
  readonly $state: ReactiveResourceState;
  name: string;
  age: number;
  bestFriend: User | null;
  readonly [Type]: 'user';
}

function setup() {
  const Store = useRecommendedStore({
    cache: JSONAPICache,
    schemas: [
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'age', kind: 'field' },
          {
            name: 'bestFriend',
            type: 'user',
            kind: 'belongsTo',
            options: { inverse: null, async: false, linksMode: true },
          },
        ],
      }),
    ],
  });
  return new Store();
}

type TestStore = ReturnType<typeof setup>;

function pushUser(store: TestStore, id = '1', name = 'Chris'): User {
  return store.push<User>({
    data: {
      type: 'user',
      id,
      attributes: { name, age: 40 },
      relationships: { bestFriend: { data: null } },
    },
  });
}

/**
 * Renders every flag of a resource's `$state`, so tests can assert that
 * the rendered output (not just a fresh property read) updates.
 */
async function renderState(context: RenderingTestContext, record: User | EditableUser): Promise<void> {
  const state = record.$state;
  await context.render(
    <template>
      <div data-test-new>{{state.isNew}}</div>
      <div data-test-empty>{{state.isEmpty}}</div>
      <div data-test-deleted>{{state.isDeleted}}</div>
      <div data-test-dirty>{{state.isDirty}}</div>
    </template>
  );
}

let nameReads = 0;
let ageReads = 0;

/** Counts how often each field's change entry is re-read by a render. */
class ChangesView extends Component<{ Args: { state: ReactiveResourceState } }> {
  get name(): string {
    nameReads++;
    const change = this.args.state.changes.name;
    return change?.kind === 'field' ? `${String(change.remoteState)} -> ${String(change.localState)}` : 'unchanged';
  }
  get age(): string {
    ageReads++;
    return this.args.state.changes.age ? 'changed' : 'unchanged';
  }
  get keys(): string {
    return Object.keys(this.args.state.changes).join(',');
  }
  <template>
    <div data-test-name>{{this.name}}</div>
    <div data-test-age>{{this.age}}</div>
    <div data-test-keys>{{this.keys}}</div>
  </template>
}

module('Reactivity | $state', function (hooks) {
  setupRenderingTest(hooks);

  test('withDefaults adds a non-enumerable $state field', function (assert) {
    const store = setup();
    const user = pushUser(store);

    assert.true('$state' in user, '$state is a field');
    assert.false(Object.keys(user).includes('$state'), '$state is not enumerable');
    assert.equal(user.$state, user.$state, '$state is stable');
    assert.deepEqual(
      JSON.parse(JSON.stringify(user.$state)) as object,
      {
        isNew: false,
        isEmpty: false,
        isDeleted: false,
        isDeletionCommitted: false,
        isDirty: false,
        changes: [],
      },
      'a remote resource starts clean'
    );
  });

  test('isNew and isDirty reflect a locally created resource', function (assert) {
    const store = setup();
    const user = store.createRecord<EditableUser>('user', { name: 'Chris' });

    assert.true(user.$state.isNew, 'isNew');
    assert.false(user.$state.isEmpty, 'a new resource is never empty');
    assert.true(user.$state.isDirty, 'a new resource is dirty');

    store.deleteRecord(user);

    assert.true(user.$state.isDeleted, 'isDeleted');
    assert.false(user.$state.isDirty, 'a new resource deleted before it is saved is not dirty');
  });

  test('isDirty reacts to edits on a checkout, and is shared by both projections', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await renderState(this, user);
    assert.dom('[data-test-dirty]').hasText('false', 'immutable starts clean');
    assert.false(editable.$state.isDirty, 'editable starts clean');

    editable.name = 'Christopher';
    assert.true(editable.$state.isDirty, 'a synchronous read reflects the edit');
    await this.h.rerender();

    assert.true(editable.$state.isDirty, 'editable is dirty after an edit');
    assert.dom('[data-test-dirty]').hasText('true', 'the rendered immutable $state updates');
  });

  test('isDeleted reacts to deleteRecord', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);

    await renderState(this, user);
    assert.dom('[data-test-deleted]').hasText('false', 'not deleted');
    assert.dom('[data-test-dirty]').hasText('false', 'not dirty');

    store.deleteRecord(user);
    await this.h.rerender();

    assert.dom('[data-test-deleted]').hasText('true', 'deleted');
    assert.dom('[data-test-dirty]').hasText('true', 'a pending deletion is dirty');
    assert.false(user.$state.isDeletionCommitted, 'deletion is not committed');
  });

  test('isEmpty becomes true when the resource is unloaded while rendered', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);

    await renderState(this, user);
    assert.dom('[data-test-empty]').hasText('false', 'a loaded resource is not empty');

    store.unloadRecord(user);
    await this.h.rerender();

    assert.dom('[data-test-empty]').hasText('true', 'the rendered $state reports the unload');
  });

  test('changes reports each changed field, and each field is reactive on its own', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);
    const state = user.$state;
    nameReads = 0;
    ageReads = 0;

    await this.render(<template><ChangesView @state={{state}} /></template>);
    assert.dom('[data-test-name]').hasText('unchanged', 'name starts unchanged');
    assert.dom('[data-test-age]').hasText('unchanged', 'age starts unchanged');
    assert.dom('[data-test-keys]').hasText('', 'no changed keys');
    assert.equal(nameReads, 1, 'name read once');
    assert.equal(ageReads, 1, 'age read once');

    editable.name = 'Christopher';
    await this.h.rerender();

    assert.dom('[data-test-name]').hasText('Chris -> Christopher', 'the name change is rendered');
    assert.dom('[data-test-keys]').hasText('name', 'name is the only changed key');
    assert.equal(nameReads, 2, 'name re-rendered');
    assert.equal(ageReads, 1, 'age did not re-render for a change to name');
    assert.deepEqual(
      user.$state.changes.name,
      { kind: 'field', remoteState: 'Chris', localState: 'Christopher' },
      'the change carries the remote and local values'
    );
    assert.equal(user.$state.changes.age, undefined, 'an unchanged field has no entry');
    assert.false('age' in user.$state.changes, 'an unchanged field is not `in` changes');
    assert.equal(user.$state.changes.$type, undefined, 'derived fields are not tracked');

    await commit(editable);
    await this.h.rerender();

    assert.dom('[data-test-name]').hasText('unchanged', 'committing clears the change');
    assert.dom('[data-test-keys]').hasText('', 'no changed keys after commit');
  });

  test('changes reports a relationship change as a RelationshipDiff', async function (this: RenderingTestContext, assert) {
    const store = setup();
    const user = pushUser(store);
    const rey = pushUser(store, '2', 'Rey');
    const editable = await checkout<EditableUser>(user);

    assert.equal(user.$state.changes.bestFriend, undefined, 'bestFriend starts unchanged');

    editable.bestFriend = rey;

    // read synchronously, before any render or notification flush

    const change = user.$state.changes.bestFriend;
    assert.equal(change?.kind, 'resource', 'the change is a to-one RelationshipDiff');
    if (change?.kind === 'resource') {
      assert.equal(change.remoteState, null, 'remoteState is the remote member');
      assert.equal(change.localState?.id, '2', 'localState is the new member');
    }
    assert.deepEqual(Object.keys(user.$state.changes), ['bestFriend'], 'bestFriend is the only changed key');
  });
});
