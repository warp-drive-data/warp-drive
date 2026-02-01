import { useRecommendedStore } from '@warp-drive/core';
import { registerDerivations } from '@warp-drive/core/reactive';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { field, id, registerSchemas, Resource } from '@warp-drive/schema-dsl';

// Note: Tests use explicit type names like @Resource('user') because these tests
// run at runtime in minified production builds where class names get shortened.
// In real apps, the Vite plugin compiles schemas at build time before minification,
// so @Resource without an argument works correctly.

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

interface CustomUserRecord {
  id: string | null;
  $type: 'custom-user';
  name: string;
  readonly [Type]: 'custom-user';
}

interface UserWithUuid {
  uuid: string | null;
  $type: 'user';
  name: string;
  readonly [Type]: 'user';
}

interface UserWithEmail {
  id: string | null;
  $type: 'user';
  firstName: string;
  lastName: string;
  email: string;
  readonly [Type]: 'user';
}

interface SimpleUser {
  id: string | null;
  $type: 'user';
  name: string;
  readonly [Type]: 'user';
}

interface PostRecord {
  id: string | null;
  $type: 'post';
  title: string;
  readonly [Type]: 'post';
}

module('Schema DSL | @Resource decorator', function (hooks) {
  setupTest(hooks);

  test('registers a basic resource schema', function (assert) {
    @Resource('user')
    class User {
      @field declare firstName: string;
      @field declare lastName: string;
    }

    const store = new Store();
    registerDerivations(store.schema);
    registerSchemas(store.schema, [User]);

    const record = store.createRecord<UserRecord>('user', {
      firstName: 'Rey',
      lastName: 'Skybarker',
    });

    assert.equal(record.firstName, 'Rey', 'firstName is accessible');
    assert.equal(record.lastName, 'Skybarker', 'lastName is accessible');
    assert.equal(record.$type, 'user', '$type derived field works');
  });

  test('respects explicit type name', function (assert) {
    @Resource('custom-user')
    class User {
      @field declare name: string;
    }

    const store = new Store();
    registerDerivations(store.schema);
    registerSchemas(store.schema, [User]);

    const record = store.createRecord<CustomUserRecord>('custom-user', { name: 'Rey' });
    assert.equal(record.name, 'Rey', 'record created with custom type');
  });

  test('supports custom identity field with @id', function (assert) {
    @Resource('user')
    class User {
      @id declare uuid: string;
      @field declare name: string;
    }

    const store = new Store();
    registerDerivations(store.schema);
    registerSchemas(store.schema, [User]);

    const record = store.createRecord<UserWithUuid>('user', { uuid: 'abc-123', name: 'Rey' });
    assert.equal(record.uuid, 'abc-123', 'custom identity field works');
  });

  test('supports multiple fields', function (assert) {
    @Resource('user')
    class User {
      @field declare firstName: string;
      @field declare lastName: string;
      @field declare email: string;
    }

    const store = new Store();
    registerDerivations(store.schema);
    registerSchemas(store.schema, [User]);

    const record = store.createRecord<UserWithEmail>('user', {
      firstName: 'Rey',
      lastName: 'Skybarker',
      email: 'rey@example.com',
    });

    assert.equal(record.firstName, 'Rey', 'firstName works');
    assert.equal(record.lastName, 'Skybarker', 'lastName works');
    assert.equal(record.email, 'rey@example.com', 'email works');
  });

  test('registers multiple schemas', function (assert) {
    @Resource('user')
    class User {
      @field declare name: string;
    }

    @Resource('post')
    class Post {
      @field declare title: string;
    }

    const store = new Store();
    registerDerivations(store.schema);
    registerSchemas(store.schema, [User, Post]);

    const user = store.createRecord<SimpleUser>('user', { name: 'Rey' });
    const post = store.createRecord<PostRecord>('post', { title: 'Hello' });

    assert.equal(user.name, 'Rey', 'user created');
    assert.equal(post.title, 'Hello', 'post created');
  });
});
