import EmberObject from '@ember/object';

import { DEBUG } from '@warp-drive/core/build-config/env';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import Model, { attr } from '@warp-drive/legacy/model';

import Store from './store';

class Person extends Model {
  @attr
  firstName;

  @attr
  lastName;

  // override to not call serialize()
  toJSON() {
    const { id, firstName, lastName } = this;
    return {
      id,
      type: (this.constructor as unknown as { modelName: string }).modelName,
      attributes: {
        firstName,
        lastName,
      },
    };
  }

  declare [Type]: 'person';
}

module('Serializer Contract | pushPayload method forwards to Serializer#pushPayload', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function (assert) {
    this.owner.register('service:store', Store);
    this.owner.register('model:person', Person);
  });

  test('Store#pushPayload calls Serializer#pushPayload', function (assert) {
    let pushPayloadCalled = 0;

    class TestMinimumSerializer extends EmberObject {
      pushPayload(store, rawPayload) {
        pushPayloadCalled++;

        assert.deepEqual(rawPayload, {
          id: '1',
          type: 'person',
          attributes: {
            firstName: 'John',
            lastName: 'Smith',
          },
        });

        store.push({
          data: rawPayload,
        });
      }
    }
    this.owner.register('serializer:application', TestMinimumSerializer);

    const store = this.owner.lookup('service:store') as Store;

    store.pushPayload('person', {
      id: '1',
      type: 'person',
      attributes: {
        firstName: 'John',
        lastName: 'Smith',
      },
    });
    const person = store.peekRecord<Person>('person', '1');

    assert.equal(pushPayloadCalled, 1, 'pushPayload called once');
    assert.deepEqual(
      person!.toJSON(),
      {
        id: '1',
        type: 'person',
        attributes: {
          firstName: 'John',
          lastName: 'Smith',
        },
      },
      'normalized payload is correct'
    );
  });

  if (DEBUG) {
    test('Store#pushPayload throws an error if Serializer#pushPayload is not implemented', async function (assert) {
      class TestMinimumSerializer extends EmberObject {}
      this.owner.register('serializer:application', TestMinimumSerializer);

      const store = this.owner.lookup('service:store') as Store;

      await assert.expectAssertion(() => {
        store.pushPayload('person', {
          data: {
            id: '1',
            type: 'person',
            attributes: {
              firstName: 'John',
              lastName: 'Smith',
            },
          },
        });
      }, `You cannot use 'store.pushPayload(<type>, <payload>)' unless the serializer for 'person' defines 'pushPayload'`);
    });
  }
});
