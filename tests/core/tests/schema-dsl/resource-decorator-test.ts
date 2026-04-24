import schemas, { objects, traits } from 'virtual:warp-drive-schemas';

import { withDefaults } from '@warp-drive/core/reactive';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';

module('Schema DSL | @Resource compilation', function (hooks) {
  setupTest(hooks);

  test('@Resource derives type from class name and compiles fields', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'user');

    assert.deepEqual(schema, {
      type: 'user',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'firstName' },
        { kind: 'field', name: 'lastName' },
        { kind: 'field', name: 'email' },
        { kind: '@local', name: 'isEditing' },
        { kind: '@local', name: 'dirtyCount', options: { defaultValue: 0 } },
        { kind: 'derived', name: 'displayName', type: '@concat' },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@Resource("person") overrides the type name', function (assert) {
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
    const schema = schemas.find((s: { type: string }) => s.type === 'post');

    assert.deepEqual(schema, {
      type: 'post',
      identity: { kind: '@id', name: 'uuid' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'title' },
        { kind: 'field', name: 'createdAt' },
        { kind: 'object', name: 'metadata' },
        { kind: 'array', name: 'tags' },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@field({ sourceKey }) maps the API key to the field name', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'product');

    assert.deepEqual(schema, {
      type: 'product',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
        { kind: 'field', name: 'name', sourceKey: 'product_name' },
        { kind: 'field', name: 'price', type: 'number', sourceKey: 'unit_price' },
        { kind: 'alias', name: 'productName', type: null, options: { kind: 'field', name: 'name' } },
        { kind: 'derived', name: 'constructor', type: '@constructor' },
      ],
    });
  });

  test('@field({ sourceKey }) calling withDefaults setups up the defaults', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'product');

    assert.deepEqual(
      schema,
      withDefaults({
        type: 'product',
        identity: { kind: '@id', name: 'id' },
        fields: [
          { kind: 'field', name: 'name', sourceKey: 'product_name' },
          { kind: 'field', name: 'price', type: 'number', sourceKey: 'unit_price' },
          { kind: 'alias', name: 'productName', type: null, options: { kind: 'field', name: 'name' } },
        ],
      })
    );
  });

  test('@Resource({ legacy: true }) omits derived fields and sets legacy flag', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'comment');

    assert.deepEqual(schema, {
      type: 'comment',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { kind: 'field', name: 'body' },
        { kind: 'attribute', name: 'author', type: 'string' },
        { kind: 'belongsTo', name: 'post', type: 'post', options: { async: true, inverse: 'comments' } },
        { kind: 'hasMany', name: 'replies', type: 'comment', options: { async: false, inverse: null } },
      ],
      legacy: true,
      traits: ['timestamped'],
    });
  });
});

module('Schema DSL | @local', function (hooks) {
  setupTest(hooks);

  test('@local compiles to @local field', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'user');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const isEditing = fields.find((f) => f.name === 'isEditing');
    assert.deepEqual(isEditing, { kind: '@local', name: 'isEditing' });
  });

  test('@local({ defaultValue }) includes options', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'user');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const dirtyCount = fields.find((f) => f.name === 'dirtyCount');
    assert.deepEqual(dirtyCount, { kind: '@local', name: 'dirtyCount', options: { defaultValue: 0 } });
  });
});

module('Schema DSL | @derived', function (hooks) {
  setupTest(hooks);

  test('@derived compiles to derived field with type', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'user');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const displayName = fields.find((f) => f.name === 'displayName');
    assert.deepEqual(displayName, { kind: 'derived', name: 'displayName', type: '@concat' });
  });
});

module('Schema DSL | @object and @array', function (hooks) {
  setupTest(hooks);

  test('@object compiles to object field', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'post');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const metadata = fields.find((f) => f.name === 'metadata');
    assert.deepEqual(metadata, { kind: 'object', name: 'metadata' });
  });

  test('@array compiles to array field', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'post');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const tags = fields.find((f) => f.name === 'tags');
    assert.deepEqual(tags, { kind: 'array', name: 'tags' });
  });
});

module('Schema DSL | @alias', function (hooks) {
  setupTest(hooks);

  test('@alias compiles to alias field pointing to source', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'product');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const productName = fields.find((f) => f.name === 'productName');
    assert.deepEqual(productName, {
      kind: 'alias',
      name: 'productName',
      type: null,
      options: { kind: 'field', name: 'name' },
    });
  });
});

module('Schema DSL | legacy decorators', function (hooks) {
  setupTest(hooks);

  test('@attribute compiles to attribute field', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'comment');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const author = fields.find((f) => f.name === 'author');
    assert.deepEqual(author, { kind: 'attribute', name: 'author', type: 'string' });
  });

  test('@belongsTo compiles to belongsTo field with options', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'comment');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const post = fields.find((f) => f.name === 'post');
    assert.deepEqual(post, {
      kind: 'belongsTo',
      name: 'post',
      type: 'post',
      options: { async: true, inverse: 'comments' },
    });
  });

  test('@hasMany compiles to hasMany field with options', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'comment');
    const fields = (schema as { fields: Array<{ kind: string; name: string }> }).fields;

    const replies = fields.find((f) => f.name === 'replies');
    assert.deepEqual(replies, {
      kind: 'hasMany',
      name: 'replies',
      type: 'comment',
      options: { async: false, inverse: null },
    });
  });
});

module('Schema DSL | @trait composition', function (hooks) {
  setupTest(hooks);

  test('@trait adds traits array to resource schema', function (assert) {
    const schema = schemas.find((s: { type: string }) => s.type === 'comment');
    assert.deepEqual((schema as { traits?: string[] }).traits, ['timestamped']);
  });
});

module('Schema DSL | @Object compilation', function (hooks) {
  setupTest(hooks);

  test('@ObjectSchema compiles to ObjectSchema with hash identity', function (assert) {
    assert.ok(Array.isArray(objects), 'objects export is an array');
    const schema = objects.find((s: { type: string }) => s.type === 'address');
    assert.ok(schema, 'address object schema found');

    assert.deepEqual(schema, {
      type: 'address',
      identity: { kind: '@hash', name: 'addressHash', type: '@identity' },
      fields: [
        { kind: 'field', name: 'street' },
        { kind: 'field', name: 'city' },
      ],
    });
  });
});

module('Schema DSL | @Trait compilation', function (hooks) {
  setupTest(hooks);

  test('@Trait compiles to Trait schema', function (assert) {
    assert.ok(Array.isArray(traits), 'traits export is an array');
    const schema = traits.find((s: { name: string }) => s.name === 'timestamped');
    assert.ok(schema, 'timestamped trait found');

    assert.deepEqual(schema, {
      name: 'timestamped',
      mode: 'polaris',
      fields: [
        { kind: 'field', name: 'createdAt' },
        { kind: 'field', name: 'updatedAt' },
      ],
    });
  });
});

module('Schema DSL | compilation totals', function (hooks) {
  setupTest(hooks);

  test('compiles all resource schemas', function (assert) {
    assert.ok(Array.isArray(schemas), 'compiled output is an array');
    assert.equal(schemas.length, 5, 'five resource schemas compiled');

    const types = schemas.map((s: { type: string }) => s.type).sort();
    assert.deepEqual(types, ['comment', 'person', 'post', 'product', 'user']);
  });

  test('compiles object schemas', function (assert) {
    assert.ok(Array.isArray(objects), 'objects export is an array');
    assert.equal(objects.length, 1, 'one object schema compiled');
  });

  test('compiles trait schemas', function (assert) {
    assert.ok(Array.isArray(traits), 'traits export is an array');
    assert.equal(traits.length, 1, 'one trait schema compiled');
  });
});
