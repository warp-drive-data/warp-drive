/* eslint-disable warp-drive/no-legacy-request-patterns */
import EmberObject from '@ember/object';

import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import Model, { attr } from '@warp-drive/legacy/model';

import Store from './store';

module('Serializer Contract | running requests with minimum serializer', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function (assert) {
    this.owner.register('service:store', Store);
    this.owner.register(
      'model:person',
      class Person extends Model {
        @attr name;
      }
    );
  });

  test('findAll calls normalizeResponse', async function (assert) {
    let normalizeResponseCalled = 0;

    class TestMinimumSerializer extends EmberObject {
      normalizeResponse(store, schema, rawPayload, id, requestType) {
        normalizeResponseCalled++;
        assert.equal(requestType, 'findAll', 'expected method name is correct');
        assert.deepEqual(rawPayload, { data: [] });
        return {
          data: [
            {
              type: 'person',
              id: 'urn:person:1',
              attributes: {
                name: 'Chris',
              },
            },
          ],
        };
      }
    }
    this.owner.register('serializer:application', TestMinimumSerializer);

    class TestAdapter extends JSONAPIAdapter {
      ajax(url, type) {
        return Promise.resolve({ data: [] });
      }
    }
    this.owner.register('adapter:application', TestAdapter);

    const store = this.owner.lookup('service:store');

    const response = await store.findAll('person');

    assert.equal(normalizeResponseCalled, 1, 'normalizeResponse is called once');
    assert.deepEqual(
      response.map((r) => r.id),
      ['urn:person:1'],
      'response is expected response'
    );
  });

  test('findRecord calls normalizeResponse', async function (assert) {
    let normalizeResponseCalled = 0;

    class TestMinimumSerializer extends EmberObject {
      normalizeResponse(store, schema, rawPayload, id, requestType) {
        normalizeResponseCalled++;
        assert.equal(requestType, 'findRecord', 'expected method name is correct');
        assert.deepEqual(rawPayload, {
          data: {
            type: 'person',
            id: 'urn:person:1',
            attributes: {
              name: 'Chris',
            },
          },
        });
        return {
          data: {
            type: 'person',
            id: 'urn:person:1',
            attributes: {
              name: 'John',
            },
          },
        };
      }
    }
    this.owner.register('serializer:application', TestMinimumSerializer);

    class TestAdapter extends JSONAPIAdapter {
      ajax(url, type) {
        return Promise.resolve({
          data: {
            type: 'person',
            id: 'urn:person:1',
            attributes: {
              name: 'Chris',
            },
          },
        });
      }
    }
    this.owner.register('adapter:application', TestAdapter);

    const store = this.owner.lookup('service:store');

    const response = await store.findRecord('person', 'urn:person:1');

    assert.equal(normalizeResponseCalled, 1, 'normalizeResponse is called once');
    assert.deepEqual(response.name, 'John', 'response is expected response');
  });

  test('query calls normalizeResponse', async function (assert) {
    let normalizeResponseCalled = 0;

    class TestMinimumSerializer extends EmberObject {
      normalizeResponse(store, schema, rawPayload, id, requestType) {
        normalizeResponseCalled++;
        assert.equal(requestType, 'query', 'expected method name is correct');
        assert.deepEqual(rawPayload, { data: [] });
        return {
          data: [
            {
              type: 'person',
              id: 'urn:person:1',
              attributes: {
                name: 'Chris',
              },
            },
          ],
        };
      }
    }
    this.owner.register('serializer:application', TestMinimumSerializer);

    class TestAdapter extends JSONAPIAdapter {
      ajax(url, type) {
        return Promise.resolve({ data: [] });
      }
    }
    this.owner.register('adapter:application', TestAdapter);

    const store = this.owner.lookup('service:store');

    const response = await store.query('person', { name: 'Chris' });

    assert.equal(normalizeResponseCalled, 1, 'normalizeResponse is called once');
    assert.deepEqual(
      response.map((r) => r.id),
      ['urn:person:1'],
      'response is expected response'
    );
  });

  test('queryRecord calls normalizeResponse', async function (assert) {
    let normalizeResponseCalled = 0;

    class TestMinimumSerializer extends EmberObject {
      normalizeResponse(store, schema, rawPayload, id, requestType) {
        normalizeResponseCalled++;
        assert.equal(requestType, 'queryRecord', 'expected method name is correct');
        assert.deepEqual(rawPayload, {
          data: {
            type: 'person',
            id: 'urn:person:1',
            attributes: {
              name: 'Chris',
            },
          },
        });
        return {
          data: {
            type: 'person',
            id: 'urn:person:1',
            attributes: {
              name: 'John',
            },
          },
        };
      }
    }
    this.owner.register('serializer:application', TestMinimumSerializer);

    class TestAdapter extends JSONAPIAdapter {
      ajax(url, type) {
        return Promise.resolve({
          data: {
            type: 'person',
            id: 'urn:person:1',
            attributes: {
              name: 'Chris',
            },
          },
        });
      }
    }
    this.owner.register('adapter:application', TestAdapter);

    const store = this.owner.lookup('service:store');

    const response = await store.queryRecord('person', { name: 'Chris' });

    assert.equal(normalizeResponseCalled, 1, 'normalizeResponse is called once');
    assert.deepEqual(response.name, 'John', 'response is expected response');
  });
});
