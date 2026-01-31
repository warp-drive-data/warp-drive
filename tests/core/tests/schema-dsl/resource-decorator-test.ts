import { useRecommendedStore } from '@warp-drive/core';
import { registerDerivations } from '@warp-drive/core/reactive';
import { compileResourceSchema, compileResourceSchemas, field, id, Resource } from '@warp-drive/core/schema-dsl';
import type { ResourceSchema, Schema } from '@warp-drive/core/types/schema/fields';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface UserRecord {
  id: string | null;
  $type: 'user';
  firstName: string;
  lastName: string;
  readonly [Type]: 'user';
}

module('Schema DSL | @Resource decorator', function (hooks) {
  setupTest(hooks);

  test('compiles a basic resource schema', function (assert) {
    @Resource
    class User {
      @field declare firstName: string;
      @field declare lastName: string;
    }

    const schema = compileResourceSchema(User) as ResourceSchema;

    assert.equal(schema.type, 'user', 'type is derived from class name');
    assert.equal(schema.identity.kind, '@id', 'identity kind is @id');
    assert.equal(schema.identity.name, 'id', 'identity name defaults to id');

    const fieldNames = schema.fields.map((f: { name: string }) => f.name);
    assert.ok(fieldNames.includes('firstName'), 'firstName field is present');
    assert.ok(fieldNames.includes('lastName'), 'lastName field is present');
    assert.ok(fieldNames.includes('$type'), '$type derived field is present');
    assert.ok(fieldNames.includes('constructor'), 'constructor derived field is present');
  });

  test('respects explicit type name', function (assert) {
    @Resource('custom-user')
    class User {
      @field declare name: string;
    }

    const schema = compileResourceSchema(User) as ResourceSchema;
    assert.equal(schema.type, 'custom-user', 'explicit type name is used');
  });

  test('compiles legacy mode schema', function (assert) {
    @Resource({ legacy: true })
    class Post {
      @field declare title: string;
    }

    const schema = compileResourceSchema(Post) as ResourceSchema;
    assert.equal(schema.type, 'post', 'type is derived from class name');
    assert.true('legacy' in schema && schema.legacy === true, 'legacy flag is set');

    const fieldNames = schema.fields.map((f: { name: string }) => f.name);
    assert.ok(fieldNames.includes('title'), 'title field is present');
    assert.notOk(fieldNames.includes('$type'), '$type is not included in legacy mode');
    assert.notOk(fieldNames.includes('constructor'), 'constructor is not included in legacy mode');
  });

  test('supports custom identity field with @id', function (assert) {
    @Resource
    class User {
      @id declare uuid: string;
      @field declare name: string;
    }

    const schema = compileResourceSchema(User) as ResourceSchema;
    assert.equal(schema.identity.name, 'uuid', 'custom identity field name is used');
  });

  test('supports field options', function (assert) {
    @Resource
    class User {
      @field({ type: 'date-time' })
      declare createdAt: Date;

      @field({ sourceKey: 'email_address' })
      declare email: string;
    }

    const schema = compileResourceSchema(User) as ResourceSchema;

    const createdAtField = schema.fields.find((f: { name: string }) => f.name === 'createdAt');
    assert.ok(createdAtField, 'createdAt field exists');
    assert.equal((createdAtField as { type?: string })?.type, 'date-time', 'type option is set');

    const emailField = schema.fields.find((f: { name: string }) => f.name === 'email');
    assert.ok(emailField, 'email field exists');
    assert.equal((emailField as { sourceKey?: string })?.sourceKey, 'email_address', 'sourceKey option is set');
  });

  test('compiles multiple schemas', function (assert) {
    @Resource
    class User {
      @field declare name: string;
    }

    @Resource
    class Post {
      @field declare title: string;
    }

    const schemas = compileResourceSchemas([User, Post]) as ResourceSchema[];
    assert.equal(schemas.length, 2, 'two schemas compiled');
    assert.equal(schemas[0].type, 'user', 'first schema is user');
    assert.equal(schemas[1].type, 'post', 'second schema is post');
  });

  test('throws if class is not decorated with @Resource', function (assert) {
    class NotAResource {
      name!: string;
    }

    assert.throws(
      () => {
        compileResourceSchema(NotAResource as unknown as new (...args: unknown[]) => object);
      },
      /class is not decorated with @Resource/,
      'throws descriptive error'
    );
  });

  test('works end-to-end with store', function (assert) {
    @Resource
    class User {
      @field declare firstName: string;
      @field declare lastName: string;
    }

    const store = new Store();
    registerDerivations(store.schema);

    const schemas = compileResourceSchemas([User]) as ResourceSchema[];
    store.schema.registerResources(schemas as Schema[]);

    const record = store.createRecord<UserRecord>('user', {
      firstName: 'Rey',
      lastName: 'Skybarker',
    });

    assert.equal(record.firstName, 'Rey', 'firstName is accessible');
    assert.equal(record.lastName, 'Skybarker', 'lastName is accessible');
    assert.equal(record.$type, 'user', '$type derived field works');
  });
});
