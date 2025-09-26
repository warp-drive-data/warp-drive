import { useRecommendedStore } from '@warp-drive/core';
import { DEBUG } from '@warp-drive/core/build-config/env';
import type { ReactiveResource } from '@warp-drive/core/reactive';
import { withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});
interface User {
  id: string | null;
  $type: 'user';
  firstName: string;
  lastName: string;
  readonly fullName: string;
}

module('Reads | derivation', function (hooks) {
  setupTest(hooks);

  test('we can use simple fields with no `type`', function (assert) {
    const store = new Store();
    const { schema } = store;

    function concat(
      record: ReactiveResource & { [key: string]: unknown },
      options: Record<string, unknown> | null,
      _prop: string
    ): string {
      if (!options) throw new Error(`options is required`);
      const opts = options as { fields: string[]; separator?: string };
      return opts.fields.map((field) => record[field]).join(opts.separator ?? '');
    }
    concat[Type] = 'concat';

    schema.registerDerivation(concat);

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'firstName',
            kind: 'field',
          },
          {
            name: 'lastName',
            kind: 'field',
          },
          {
            name: 'fullName',
            type: 'concat',
            options: { fields: ['firstName', 'lastName'], separator: ' ' },
            kind: 'derived',
          },
        ],
      })
    );

    const record = store.createRecord('user', { firstName: 'Rey', lastName: 'Skybarker' }) as User;

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');

    assert.equal(record.firstName, 'Rey', 'firstName is accessible');
    assert.equal(record.lastName, 'Skybarker', 'lastName is accessible');
    assert.equal(record.fullName, 'Rey Skybarker', 'fullName is accessible');
  });

  test('throws an error if derivation is not found', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'firstName',
            kind: 'field',
          },
          {
            name: 'lastName',
            kind: 'field',
          },
          {
            name: 'fullName',
            type: 'concat',
            options: { fields: ['firstName', 'lastName'], separator: ' ' },
            kind: 'derived',
          },
        ],
      })
    );

    const record = store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          firstName: 'Rey',
          lastName: 'Pupatine',
        },
      },
    }) as User;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      record.fullName;
      assert.ok(false, 'record.fullName should throw');
    } catch (e) {
      assert.equal(
        (e as Error).message,
        DEBUG
          ? "No 'concat' derivation registered for use by the 'derived' field 'fullName'"
          : 't.derivation(...) is not a function',
        'record.fullName throws'
      );
    }
  });
});
