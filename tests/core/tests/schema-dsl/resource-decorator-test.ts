import schemas from 'virtual:warp-drive-schemas';

import { withDefaults } from '@warp-drive/core/reactive';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';

module('Schema DSL | @Resource compilation', function (hooks) {
  setupTest(hooks);

  test('@Resource derives type from class name and compiles fields', function (assert) {
    //   @Resource
    //   class User {
    //     @field declare firstName: string;
    //     @field declare lastName: string;
    //     @field declare email: string;
    //   }

    const schema = schemas.find((s: { type: string }) => s.type === 'user');

    assert.deepEqual(schema, {
      type: 'user',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'firstName' },
        { kind: 'field', name: 'lastName' },
        { kind: 'field', name: 'email' },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@Resource("person") overrides the type name', function (assert) {
    //   @Resource('person')
    //   class CustomUser {
    //     @field declare name: string;
    //   }

    const schema = schemas.find((s: { type: string }) => s.type === 'person');

    assert.deepEqual(schema, {
      type: 'person',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'name' },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@id sets a custom identity field', function (assert) {
    //   @Resource
    //   class Post {
    //     @id declare uuid: string;
    //     @field declare title: string;
    //     @field({ type: 'date-time' }) declare createdAt: Date;
    //   }

    const schema = schemas.find((s: { type: string }) => s.type === 'post');

    assert.deepEqual(schema, {
      type: 'post',
      identity: { kind: '@id', name: 'uuid' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'title' },
        { kind: 'field', name: 'createdAt', type: 'date-time' },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@field({ sourceKey }) maps the API key to the field name', function (assert) {
    //   @Resource
    //   class Product {
    //     @field({ sourceKey: 'product_name' }) declare name: string;
    //     @field({ type: 'number', sourceKey: 'unit_price' }) declare price: number;
    //   }

    const schema = schemas.find((s: { type: string }) => s.type === 'product');

    assert.deepEqual(schema, {
      type: 'product',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'name', sourceKey: 'product_name' },
        { kind: 'field', name: 'price', type: 'number', sourceKey: 'unit_price' },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@field({ sourceKey }) calling withDefaults setups up the defaults', function (assert) {
    //   @Resource
    //   class Product {
    //     @field({ sourceKey: 'product_name' }) declare name: string;
    //     @field({ type: 'number', sourceKey: 'unit_price' }) declare price: number;
    //   }

    const schema = schemas.find((s: { type: string }) => s.type === 'product');

    assert.deepEqual(
      schema,
      withDefaults({
        type: 'product',
        identity: { kind: '@id', name: 'id' },
        fields: [
          { kind: 'field', name: 'name', sourceKey: 'product_name' },
          { kind: 'field', name: 'price', type: 'number', sourceKey: 'unit_price' },
        ],
      })
    );
  });

  test('@Resource({ legacy: true }) omits derived fields and sets legacy flag', function (assert) {
    //   @Resource({ legacy: true })
    //   class Comment {
    //     @field declare body: string;
    //   }

    const schema = schemas.find((s: { type: string }) => s.type === 'comment');

    assert.deepEqual(schema, {
      type: 'comment',
      identity: { kind: '@id', name: 'id' },
      fields: [{ kind: 'field', name: 'body' }],
      legacy: true,
    });
  });

  test('compiles all schema files in the glob', function (assert) {
    assert.ok(Array.isArray(schemas), 'compiled output is an array');
    assert.equal(schemas.length, 5, 'all five schema files were compiled');

    const types = schemas.map((s: { type: string }) => s.type).sort();
    assert.deepEqual(types, ['comment', 'person', 'post', 'product', 'user'], 'all expected types present');
  });
});
