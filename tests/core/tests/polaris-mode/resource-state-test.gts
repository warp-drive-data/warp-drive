import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import type { ReactiveResourceState } from '@warp-drive/core/reactive';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import type { RenderingTestContext } from '@warp-drive/diagnostic/ember';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

interface User {
  readonly id: string | null;
  readonly $type: 'user';
  readonly $state: ReactiveResourceState;
  readonly name: string;
  readonly [Type]: 'user';
}

interface EditableUser {
  readonly id: string | null;
  readonly $type: 'user';
  readonly $state: ReactiveResourceState;
  name: string;
  readonly [Type]: 'user';
}

interface Deferred {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

function deferred(): Deferred {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const pending: Deferred[] = [];
  const Store = useRecommendedStore({
    cache: JSONAPICache,
    handlers: [
      {
        request() {
          const d = deferred();
          pending.push(d);
          return d.promise;
        },
      },
    ],
    schemas: [withDefaults({ type: 'user', fields: [{ name: 'name', kind: 'field' }] })],
  });
  return { store: new Store(), pending };
}

/** Handlers run asynchronously, so wait until the handler has been reached `count` times. */
async function waitForPending(pending: Deferred[], count: number): Promise<void> {
  while (pending.length < count) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

type TestStore = ReturnType<typeof setup>['store'];

function pushUser(store: TestStore): User {
  return store.push<User>({ data: { type: 'user', id: '1', attributes: { name: 'Chris' } } });
}

function saveRequest(record: User | EditableUser) {
  return {
    op: 'updateRecord' as const,
    url: '/users/1',
    method: 'PUT' as const,
    records: [recordIdentifierFor(record)],
  };
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
      <div data-test-deleted>{{state.isDeleted}}</div>
      <div data-test-dirty>{{state.isDirty}}</div>
      <div data-test-saving>{{state.isSaving}}</div>
      <div data-test-valid>{{state.isValid}}</div>
      <div data-test-error>{{state.isError}}</div>
    </template>
  );
}

module('Reactivity | $state', function (hooks) {
  setupRenderingTest(hooks);

  test('withDefaults adds a non-enumerable $state field', function (assert) {
    const { store } = setup();
    const user = pushUser(store);

    assert.true('$state' in user, '$state is a field');
    assert.false(Object.keys(user).includes('$state'), '$state is not enumerable');
    assert.equal(user.$state, user.$state, '$state is stable');
    assert.deepEqual(
      JSON.parse(JSON.stringify(user.$state)) as object,
      {
        isNew: false,
        isDeleted: false,
        isDeletionCommitted: false,
        isDirty: false,
        isSaving: false,
        isValid: true,
        isError: false,
      },
      'a remote resource starts clean'
    );
    assert.deepEqual(user.$state.errors, [], 'no errors');
    assert.equal(user.$state.error, null, 'no request error');
  });

  test('isNew and isDirty reflect a locally created resource', function (assert) {
    const { store } = setup();
    const user = store.createRecord<EditableUser>('user', { name: 'Chris' });

    assert.true(user.$state.isNew, 'isNew');
    assert.true(user.$state.isDirty, 'a new resource is dirty');

    store.deleteRecord(user);

    assert.true(user.$state.isDeleted, 'isDeleted');
    assert.false(user.$state.isDirty, 'a new resource deleted before it is saved is not dirty');
  });

  test('isDirty reacts to edits on a checkout, and is shared by both projections', async function (this: RenderingTestContext, assert) {
    const { store } = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await renderState(this, user);
    assert.dom('[data-test-dirty]').hasText('false', 'immutable starts clean');
    assert.false(editable.$state.isDirty, 'editable starts clean');

    editable.name = 'Christopher';
    await this.h.rerender();

    assert.true(editable.$state.isDirty, 'editable is dirty after an edit');
    assert.dom('[data-test-dirty]').hasText('true', 'the rendered immutable $state updates');
  });

  test('isDeleted reacts to deleteRecord', async function (this: RenderingTestContext, assert) {
    const { store } = setup();
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

  test('isSaving tracks an in-flight mutation and clears on success', async function (this: RenderingTestContext, assert) {
    const { store, pending } = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await renderState(this, user);
    assert.dom('[data-test-saving]').hasText('false', 'not saving');

    editable.name = 'Christopher';
    const request = store.request(saveRequest(editable));
    await waitForPending(pending, 1);
    await this.h.rerender();

    assert.dom('[data-test-saving]').hasText('true', 'saving while the request is pending');

    pending[0].resolve({ data: { type: 'user', id: '1', attributes: { name: 'Christopher' } } });
    await request;
    await this.h.rerender();

    assert.dom('[data-test-saving]').hasText('false', 'no longer saving');
    assert.false(user.$state.isDirty, 'the saved change is no longer dirty');
    assert.false(user.$state.isError, 'no error');
  });

  test('a rejected mutation with validation errors sets errors and isValid, not isError', async function (this: RenderingTestContext, assert) {
    const { store, pending } = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await renderState(this, user);
    assert.dom('[data-test-valid]').hasText('true', 'valid');

    editable.name = '';
    const request = store.request(saveRequest(editable));
    await waitForPending(pending, 1);

    const errors = [{ title: 'Invalid name', detail: 'name is required', source: { pointer: '/data/attributes/name' } }];
    pending[0].reject(Object.assign(new Error('Unprocessable'), { content: { errors } }));
    await request.catch(() => {});
    await this.h.rerender();

    assert.dom('[data-test-valid]').hasText('false', 'invalid');
    assert.dom('[data-test-error]').hasText('false', 'a validation failure is not a request error');
    assert.equal(user.$state.errors.length, 1, 'one error');
    assert.equal(user.$state.errors[0].source?.pointer, '/data/attributes/name', 'error points at the field');
    assert.false(user.$state.isSaving, 'no longer saving');
  });

  test('a rejected mutation without validation errors sets isError and error', async function (this: RenderingTestContext, assert) {
    const { store, pending } = setup();
    const user = pushUser(store);
    const editable = await checkout<EditableUser>(user);

    await renderState(this, user);
    assert.dom('[data-test-error]').hasText('false', 'no error');

    editable.name = 'Christopher';
    const request = store.request(saveRequest(editable));
    await waitForPending(pending, 1);

    pending[0].reject(new Error('Server Error'));
    await request.catch(() => {});
    await this.h.rerender();

    assert.dom('[data-test-error]').hasText('true', 'isError');
    assert.ok(user.$state.error, 'error is the rejection');
    assert.true(user.$state.isValid, 'still valid');
    assert.true(user.$state.isDirty, 'the change is still dirty');

    const retry = store.request(saveRequest(editable));
    await waitForPending(pending, 2);
    pending[1].resolve({ data: { type: 'user', id: '1', attributes: { name: 'Christopher' } } });
    await retry;
    await this.h.rerender();

    assert.dom('[data-test-error]').hasText('false', 'a successful retry clears isError');
    assert.equal(user.$state.error, null, 'and error');
  });
});
