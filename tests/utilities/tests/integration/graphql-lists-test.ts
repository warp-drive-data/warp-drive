import type { TestContext } from '@ember/test-helpers';

import { parse } from 'graphql';

import JSONAPICache from '@ember-data/json-api';
import Model, { attr, buildSchema, instantiateRecord, modelFor, teardownRecord } from '@ember-data/model';
import type { Future, Handler, RequestContext, StructuredDataDocument } from '@ember-data/request';
import RequestManager from '@ember-data/request';
import {
  addToField,
  addToQueries,
  get,
  readField,
  removeFromField,
  removeFromQueries,
} from '@ember-data/request-utils/graphql';
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

const MEMBERS_BY_RANGE: Record<string, string[]> = { '2026-01-01': ['a'], '2026-02-01': ['b'] };
const PROJECTS_BY_STATUS: Record<string, string[]> = { open: ['1'], closed: ['2'] };

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

const GET_PROJECTS = parse(`
  query GetProjects($status: String) {
    projects(status: $status) {
      __typename
      id
      name
    }
  }
`);

const JAN = { from: '2026-01-01', to: '2026-01-31' };
const FEB = { from: '2026-02-01', to: '2026-02-28' };
const MAR = { from: '2026-03-01', to: '2026-03-31' };
const OPTIONS = { namespace: 'graphql' };

module('Integration - graphql lists', function (hooks) {
  setupTest(hooks);

  async function setup(owner: TestContext['owner']) {
    const Network: Handler = {
      request<T>(context: RequestContext): Promise<T | StructuredDataDocument<T>> | Future<T> {
        const { operationName, variables } = JSON.parse(context.request.body as string) as {
          operationName: string;
          variables: { from?: string; status?: string };
        };

        if (operationName === 'GetProjects') {
          const ids = PROJECTS_BY_STATUS[variables.status as string] ?? [];
          return Promise.resolve({
            data: { projects: ids.map((id) => ({ __typename: 'Project', id, name: `Project ${id}` })) },
          } as T);
        }

        const ids = MEMBERS_BY_RANGE[variables.from as string] ?? [];
        return Promise.resolve({
          data: {
            project: {
              __typename: 'Project',
              id: '1',
              name: 'Apollo',
              memberList: ids.map((id) => ({ __typename: 'Member', id, name: id.toUpperCase() })),
            },
          },
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
    const store = owner.lookup('service:store') as Store;

    await store.request(get(GET_PROJECT, 'project', JAN, OPTIONS));
    await store.request(get(GET_PROJECT, 'project', FEB, OPTIONS));
    await store.request(get(GET_PROJECTS, 'project', { status: 'open' }, OPTIONS));
    await store.request(get(GET_PROJECTS, 'project', { status: 'closed' }, OPTIONS));

    const project = store.peekRecord('project', '1') as Project;
    const members = (args: typeof JAN) =>
      (readField(store, project, 'memberList', args) as Member[]).map((member) => member.id);
    const projects = (status: string) => {
      const request = get(GET_PROJECTS, 'project', { status }, OPTIONS);
      const key = store.cacheKeyManager.getOrCreateDocumentIdentifier(request)!;
      return (store.cache.peek(key) as { data: ResourceKey[] }).data.map((k) => k.id);
    };

    return { store, project, members, projects };
  }

  test('addToField adds a record to every value of the field, or to the ones picked by their arguments', async function (this: TestContext, assert) {
    const { store, project, members } = await setup(this.owner);
    const newcomer = store.push({ data: { type: 'member', id: 'n', attributes: { name: 'New' } } }) as Member;
    const another = store.push({ data: { type: 'member', id: 'm', attributes: { name: 'More' } } }) as Member;

    addToField(store, project, 'memberList', newcomer, { where: (args) => args.from === JAN.from });
    assert.deepEqual(members(JAN), ['a', 'n'], 'it is added to the range it was asked for');
    assert.deepEqual(members(FEB), ['b'], 'and not to the others');

    addToField(store, project, 'memberList', newcomer);
    assert.deepEqual(members(JAN), ['a', 'n'], 'a record that is already in a list is not added again');
    assert.deepEqual(members(FEB), ['b', 'n'], 'it is added to the rest');

    addToField(store, project, 'memberList', another, { index: 0 });
    assert.deepEqual(members(JAN), ['m', 'a', 'n'], 'it can be added at a position');
  });

  test('addToField adds a record to a list that was fetched empty', async function (this: TestContext, assert) {
    const { store, project, members } = await setup(this.owner);
    await store.request(get(GET_PROJECT, 'project', MAR, OPTIONS));
    const newcomer = store.push({ data: { type: 'member', id: 'n', attributes: { name: 'New' } } }) as Member;

    assert.deepEqual(members(MAR), [], 'the range has no members');

    addToField(store, project, 'memberList', newcomer, { where: (args) => args.from === MAR.from });
    assert.deepEqual(members(MAR), ['n'], 'it is added to the empty list');
    assert.deepEqual(members(JAN), ['a'], 'and not to the others');
  });

  test('removeFromField removes a record from every value of the field', async function (this: TestContext, assert) {
    const { store, project, members } = await setup(this.owner);
    const ana = store.peekRecord('member', 'a') as Member;
    const newcomer = store.push({ data: { type: 'member', id: 'n', attributes: { name: 'New' } } }) as Member;
    addToField(store, project, 'memberList', newcomer);

    removeFromField(store, project, 'memberList', ana, { where: (args) => args.from === FEB.from });
    assert.deepEqual(members(JAN), ['a', 'n'], 'a record is not removed from the values that were not picked');

    removeFromField(store, project, 'memberList', ana);
    assert.deepEqual(members(JAN), ['n'], 'it is removed from the range it was in');
    assert.deepEqual(members(FEB), ['b', 'n'], 'and the ranges it was not in are left as they are');
  });

  test('addToQueries adds a record to the lists the queries of an operation fetched', async function (this: TestContext, assert) {
    const { store, projects } = await setup(this.owner);
    const created = store.push({ data: { type: 'project', id: '3', attributes: { name: 'New' } } }) as Project;

    addToQueries(store, 'GetProjects', created, { where: (variables) => variables.status === 'open' });
    assert.deepEqual(projects('open'), ['1', '3'], 'it is added to the query that was picked');
    assert.deepEqual(projects('closed'), ['2'], 'and not to the others');

    addToQueries(store, 'GetProjects', created);
    assert.deepEqual(projects('open'), ['1', '3'], 'a record that is already in a list is not added again');
    assert.deepEqual(projects('closed'), ['2', '3'], 'it is added to the rest');
  });

  test('removeFromQueries removes a record from the lists the queries of an operation fetched', async function (this: TestContext, assert) {
    const { store, projects } = await setup(this.owner);
    const open = store.peekRecord('project', '1') as Project;

    removeFromQueries(store, 'GetProjects', open, { where: (variables) => variables.status === 'closed' });
    assert.deepEqual(projects('open'), ['1'], 'a record is not removed from the queries that were not picked');

    removeFromQueries(store, 'GetProjects', open);
    assert.deepEqual(projects('open'), [], 'it is removed from the list it was in');
    assert.deepEqual(projects('closed'), ['2'], 'and the others are left as they are');
  });

  test('updating the lists of an operation that was never queried does nothing', async function (this: TestContext, assert) {
    const { store, project } = await setup(this.owner);

    addToQueries(store, 'NeverQueried', project);
    removeFromQueries(store, 'NeverQueried', project);
    assert.true(true, 'it does not throw');
  });

  test('a record without an id cannot be added to a list', async function (this: TestContext, assert) {
    const { store } = await setup(this.owner);
    const draft = store.createRecord('project', { name: 'Draft' }) as Project;

    assert.throws(() => addToQueries(store, 'GetProjects', draft), /has no id/, 'it says why');
  });
});
