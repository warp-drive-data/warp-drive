import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import Model, { attr } from '@warp-drive/legacy/model';

import Store from '../serializer/store';

class Person extends Model {
  @attr
  firstName;

  @attr
  lastName;

  declare [Type]: 'person';
}

module('Unit | Model | ModelSchemaProvider', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', Store);
    this.owner.register('model:person', Person);
  });

  test('fields() does not recurse infinitely for a type with a registered model', function (assert) {
    const store = this.owner.lookup('service:store') as Store;

    const fields = store.schema.fields({ type: 'person' });

    assert.true(fields.has('firstName'), 'firstName field is present');
    assert.true(fields.has('lastName'), 'lastName field is present');
  });

  test('fields() throws a clear error for a type with no registered model instead of recursing infinitely', function (assert) {
    const store = this.owner.lookup('service:store') as Store;

    assert.throws(
      () => store.schema.fields({ type: 'no-such-type' }),
      /No model was found for 'no-such-type'/,
      'a clear error is thrown instead of an infinite loop'
    );
  });
});
