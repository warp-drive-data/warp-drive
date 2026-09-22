import { recordIdentifierFor } from '@warp-drive/core';
import { checkout, commit } from '@warp-drive/core/reactive';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { serializePatch, serializeResources, updateRecord } from '@warp-drive/utilities/json-api';

import type { EditableUser, User } from './-utils/store';
import { createStore } from './-utils/store';

module('WarpDrive | ReactiveResource | Edit Workflow', function (hooks) {
  setupTest(hooks);

  test('we can edit a record', async function (assert) {
    const store = createStore(this.owner, {
      handlers: [
        {
          request({ request }) {
            const { url, method, body } = request;
            assert.step(`${method} ${url}`);
            return Promise.resolve(JSON.parse(body as string));
          },
        },
      ],
    });
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: { name: 'Rey Skybarker' },
      },
    });
    const editableUser = await checkout<EditableUser>(user);
    assert.equal(editableUser.name, 'Rey Skybarker', 'name is accessible');
    editableUser.name = 'Rey Skywalker';
    assert.equal(editableUser.name, 'Rey Skywalker', 'name is updated');
    assert.equal(user.name, 'Rey Skybarker', 'immutable record shows original value');

    // ensure identifier works as expected
    const identifier = recordIdentifierFor(editableUser);
    assert.equal(identifier.id, '1', 'id is accessible');
    assert.equal(identifier.type, 'user', 'type is accessible');

    // ensure save works as expected
    const saveInit = updateRecord(editableUser);
    const patch = serializePatch(store.cache, recordIdentifierFor(editableUser));
    saveInit.body = JSON.stringify(patch);

    const saveResult = await store.request(saveInit);
    assert.deepEqual(saveResult.content.data, user, 'we get the immutable version back from the request');
    assert.verifySteps(['PUT /users/1']);
    assert.equal(user.name, 'Rey Skywalker', 'name is updated in the cache and shows in the immutable record');
  });

  test('we can serialize an editable record', async function (assert) {
    const store = createStore(this.owner, {
      handlers: [
        {
          request({ request }) {
            const { url, method, body } = request;
            assert.step(`${method} ${url}`);
            return Promise.resolve(JSON.parse(body as string));
          },
        },
      ],
    });
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: { name: 'Rey Skybarker' },
      },
    });
    const editableUser = await checkout<EditableUser>(user);
    assert.equal(editableUser.name, 'Rey Skybarker', 'name is accessible');
    editableUser.name = 'Rey Skywalker';
    assert.equal(editableUser.name, 'Rey Skywalker', 'name is updated');
    assert.equal(user.name, 'Rey Skybarker', 'immutable record shows original value');

    // ensure identifier works as expected
    const identifier = recordIdentifierFor(editableUser);
    assert.equal(identifier.id, '1', 'id is accessible');
    assert.equal(identifier.type, 'user', 'type is accessible');

    // ensure save works as expected
    const saveInit = updateRecord(editableUser);
    const body = serializeResources(store.cache, saveInit.data.record);
    saveInit.body = JSON.stringify(body);

    const saveResult = await store.request(saveInit);
    assert.deepEqual(saveResult.content.data, user, 'we get the immutable version back from the request');
    assert.verifySteps(['PUT /users/1']);
    assert.equal(user.name, 'Rey Skywalker', 'name is updated in the cache and shows in the immutable record');
  });

  test('serializing the immutable record serializes the edits', async function (assert) {
    const store = createStore(this.owner, {
      handlers: [
        {
          request({ request }) {
            const { url, method, body } = request;
            assert.step(`${method} ${url}`);
            return Promise.resolve(JSON.parse(body as string));
          },
        },
      ],
    });
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: { name: 'Rey Skybarker' },
      },
    });
    const editableUser = await checkout<EditableUser>(user);
    assert.equal(editableUser.name, 'Rey Skybarker', 'name is accessible');
    editableUser.name = 'Rey Skywalker';
    assert.equal(editableUser.name, 'Rey Skywalker', 'name is updated');
    assert.equal(user.name, 'Rey Skybarker', 'immutable record shows original value');

    // ensure identifier works as expected
    const identifier = recordIdentifierFor(editableUser);
    assert.equal(identifier.id, '1', 'id is accessible');
    assert.equal(identifier.type, 'user', 'type is accessible');

    // ensure save works as expected
    const saveInit = updateRecord(user);
    const body = serializeResources(store.cache, saveInit.data.record);
    saveInit.body = JSON.stringify(body);

    const saveResult = await store.request(saveInit);
    assert.deepEqual(saveResult.content.data, user, 'we get the immutable version back from the request');
    assert.verifySteps(['PUT /users/1']);
    assert.equal(user.name, 'Rey Skywalker', 'name is updated in the cache and shows in the immutable record');
  });

  test('we can commit an editable record', async function (assert) {
    const store = createStore(this.owner, {
      handlers: [
        {
          request({ request }) {
            const { url, method, body } = request;
            assert.step(`${method} ${url}`);
            return Promise.resolve(JSON.parse(body as string));
          },
        },
      ],
    });
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: { name: 'Rey Skybarker' },
      },
    });
    const editableUser = await checkout<EditableUser>(user);
    assert.equal(editableUser.name, 'Rey Skybarker', 'name is accessible');
    editableUser.name = 'Rey Skywalker';
    assert.equal(editableUser.name, 'Rey Skywalker', 'name is updated');
    assert.equal(user.name, 'Rey Skybarker', 'immutable record shows original value');

    // ensure identifier works as expected
    const identifier = recordIdentifierFor(editableUser);
    assert.equal(identifier.id, '1', 'id is accessible');
    assert.equal(identifier.type, 'user', 'type is accessible');

    // ensure commit works as expected
    await commit(editableUser);
    assert.equal(user.name, 'Rey Skywalker', 'name is updated in the cache and shows in the immutable record');
  });
});
