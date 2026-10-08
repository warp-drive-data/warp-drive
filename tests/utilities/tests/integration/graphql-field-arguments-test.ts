import type { TestContext } from '@ember/test-helpers';

import { parse } from 'graphql';

import JSONAPICache from '@ember-data/json-api';
import Model, { attr, buildSchema, instantiateRecord, modelFor, teardownRecord } from '@ember-data/model';
import type { Future, Handler, RequestContext, StructuredDataDocument } from '@ember-data/request';
import RequestManager from '@ember-data/request';
import { get, readField } from '@ember-data/request-utils/graphql';
import DataStore, { CacheHandler } from '@ember-data/store';
import type { CacheCapabilitiesManager, ModelSchema } from '@ember-data/store/types';
import type { Cache } from '@warp-drive/core-types/cache';
import type { ResourceKey } from '@warp-drive/core-types/identifier';
import { module, test } from '@warp-drive/diagnostic';
import { setupTest } from '@warp-drive/diagnostic/ember';
import { GraphQLToJSONAPIHandler } from '@warp-drive/utilities/handlers';

class Project extends Model {
  @attr declare name: string;
}

class Member extends Model {
  @attr declare name: string;
}

const MEMBERS_BY_RANGE: Record<string, Array<{ id: string; name: string }>> = {
  '2026-01-01': [{ id: 'a', name: 'Ana' }],
  '2026-02-01': [{ id: 'b', name: 'Bo' }],
};

const GET_PROJECT = parse(`
  query GetProject($from: String, $to: String) {
    project(id: "1") {
      __typename
      id
      name
      memberList(from: $from, to: $to) {
        __typename
        id
        name
      }
    }
  }
`);

const GET_PROJECT_DETAILS = parse(`
  query GetProjectDetails {
    project(id: "1") {
      __typename
      id
      name
      avatarUrl(size: 64)
      owner(role: "admin") {
        __typename
        id
        name
      }
    }
  }
`);

module('Integration - graphql fields with arguments', function (hooks) {
  setupTest(hooks);

  function setup(owner: TestContext['owner']) {
    // stands in for the network: answers the way a GraphQL server does
    const Network: Handler = {
      request<T>(context: RequestContext): Promise<T | StructuredDataDocument<T>> | Future<T> {
        const { operationName, variables } = JSON.parse(context.request.body as string) as {
          operationName: string;
          variables: { from?: string };
        };
        const project = { __typename: 'Project', id: '1', name: 'Apollo' };

        if (operationName === 'GetProjectDetails') {
          return Promise.resolve({
            data: {
              project: {
                ...project,
                avatarUrl: 'apollo.png',
                owner: { __typename: 'Member', id: 'o', name: 'Olga' },
              },
            },
          } as T);
        }

        const members = MEMBERS_BY_RANGE[variables.from as string] ?? [];
        return Promise.resolve({
          data: { project: { ...project, memberList: members.map((m) => ({ __typename: 'Member', ...m })) } },
        } as T);
      },
    };

    class Store extends DataStore {
      constructor(args: unknown) {
        super(args);
        const manager = (this.requestManager = new RequestManager());
        manager.use([new GraphQLToJSONAPIHandler(), Network]);
        manager.useCache(CacheHandler);
      }
      createSchemaService(): ReturnType<typeof buildSchema> {
        return buildSchema(this);
      }
      override createCache(capabilities: CacheCapabilitiesManager): Cache {
        return new JSONAPICache(capabilities);
      }
      override instantiateRecord(key: ResourceKey, createRecordArgs: { [key: string]: unknown }): unknown {
        return instantiateRecord.call(this, key, createRecordArgs);
      }
      override teardownRecord(record: Model): void {
        return teardownRecord.call(this, record);
      }
      override modelFor(type: string): ModelSchema {
        return modelFor.call(this, type) as ModelSchema;
      }
    }

    owner.register('service:store', Store);
    owner.register('model:project', Project);
    owner.register('model:member', Member);
    return owner.lookup('service:store') as Store;
  }

  test('the values of a field for different arguments stay apart, and are read with the arguments', async function (this: TestContext, assert) {
    const store = setup(this.owner);
    const january = { from: '2026-01-01', to: '2026-01-31' };
    const february = { from: '2026-02-01', to: '2026-02-28' };

    await store.request(get(GET_PROJECT, 'project', january, { namespace: 'graphql' }));
    await store.request(get(GET_PROJECT, 'project', february, { namespace: 'graphql' }));

    const project = store.peekRecord('project', '1') as Project;
    const names = (value: unknown) => (value as Member[]).map((m) => m.name);

    assert.equal(project.name, 'Apollo', 'the project is in the store');
    assert.deepEqual(names(readField(store, project, 'memberList', january)), ['Ana'], 'january is read');
    assert.deepEqual(names(readField(store, project, 'memberList', february)), ['Bo'], 'february is read');
    assert.deepEqual(
      names(readField(store, project, 'memberList', january)),
      ['Ana'],
      'going back to january shows its members, not the last range that was fetched'
    );
    assert.equal(
      readField(store, project, 'memberList', { from: '2026-03-01', to: '2026-03-31' }),
      undefined,
      'a range no query has fetched has no value'
    );
  });

  test('a field with arguments can hold a single resource or a plain value', async function (this: TestContext, assert) {
    const store = setup(this.owner);

    await store.request(get(GET_PROJECT_DETAILS, 'project', {}, { namespace: 'graphql' }));

    const project = store.peekRecord('project', '1') as Project;
    const owner = readField(store, project, 'owner', { role: 'admin' }) as Member;

    assert.equal(owner.name, 'Olga', 'a single resource is read as its record');
    assert.equal(readField(store, project, 'avatarUrl', { size: 64 }), 'apollo.png', 'a plain value is read as it is');
    assert.equal(readField(store, project, 'avatarUrl', { size: 128 }), undefined, 'another size has no value');
  });
});
