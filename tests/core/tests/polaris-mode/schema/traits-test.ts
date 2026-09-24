import { useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

module('SchemaService | Traits', function (hooks) {
  setupTest(hooks);

  test('We can register and use a trait', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
        traits: ['timestamped'],
      })
    );
    schema.registerTrait!({
      name: 'timestamped',
      mode: 'polaris' as const,
      fields: [
        {
          name: 'createdAt',
          kind: 'field',
        },
        {
          name: 'deletedAt',
          kind: 'field',
        },
      ],
    });

    const fields = schema.fields({ type: 'user' });
    assert.deepEqual(
      fields.get('name'),
      {
        name: 'name',
        kind: 'field',
      },
      'name field exists'
    );
    assert.deepEqual(
      fields.get('createdAt'),
      {
        name: 'createdAt',
        kind: 'field',
      },
      'createdAt field exists'
    );
    assert.deepEqual(
      fields.get('deletedAt'),
      {
        name: 'deletedAt',
        kind: 'field',
      },
      'deletedAt field exists'
    );
  });

  test('Traits may have traits', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
        traits: ['timestamped'],
      })
    );
    schema.registerTrait!({
      name: 'timestamped',
      mode: 'polaris' as const,
      fields: [
        {
          name: 'createdAt',
          kind: 'field',
        },
      ],
      traits: ['deleteable'],
    });
    schema.registerTrait!({
      name: 'deleteable',
      mode: 'polaris' as const,
      fields: [
        {
          name: 'deletedAt',
          kind: 'field',
        },
      ],
    });

    const fields = schema.fields({ type: 'user' });
    assert.deepEqual(
      fields.get('name'),
      {
        name: 'name',
        kind: 'field',
      },
      'name field exists'
    );
    assert.deepEqual(
      fields.get('createdAt'),
      {
        name: 'createdAt',
        kind: 'field',
      },
      'createdAt field exists'
    );
    assert.deepEqual(
      fields.get('deletedAt'),
      {
        name: 'deletedAt',
        kind: 'field',
      },
      'deletedAt field exists'
    );
  });
});
