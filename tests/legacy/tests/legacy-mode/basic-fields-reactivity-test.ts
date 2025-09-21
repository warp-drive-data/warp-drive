import EmberObject from '@ember/object';
import { setOwner } from '@ember/owner';
import { rerender } from '@ember/test-helpers';

import { recordIdentifierFor } from '@warp-drive/core';
import type { ReactiveResource, Transformation } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types';
import { Type } from '@warp-drive/core/types/symbols';
import type { RenderingTestContext } from '@warp-drive/diagnostic/ember';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

import { simplePayloadNormalize } from '../-utils/normalize-payload.ts';
import { reactiveContext } from '../-utils/reactive-context.gts';

interface User {
  id: string | null;
  name: string;
  age: number;
  netWorth: number;
  coolometer: number;
  rank: number;
  [Type]: 'user';
}

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module<RenderingTestContext>('Legacy | Reactivity | basic fields can receive remote updates', function (hooks) {
  setupRenderingTest(hooks);

  test<RenderingTestContext>('we can use simple fields with no `type`', async function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const resource = schema.resource({ type: 'user' });
    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Pupatine' },
      },
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');

    const { counters, fieldOrder } = await reactiveContext(this, record, resource);
    const nameIndex = fieldOrder.indexOf('name');

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.name, 1, 'nameCount is 1');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('name: Rey Pupatine', 'name is rendered');

    // remote update
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
      },
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');

    await rerender();

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.name, 2, 'nameCount is 1');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('name: Rey Skybarker', 'name is rendered');
  });

  test<RenderingTestContext>('we can use simple fields with a `type`', async function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    this.owner.register(
      'transform:float',
      class extends EmberObject {
        serialize() {
          assert.ok(false, 'unexpected legacy serialize');
        }
        deserialize(v: number | string | null) {
          assert.step(`legacy deserialize:${v}`);
          return Number(v);
        }
      }
    );

    const FloatTransform: Transformation<string | number, number> = {
      serialize(value: string | number, options: { precision?: number } | null, _record: ReactiveResource): never {
        assert.ok(false, 'unexpected serialize');
        throw new Error('unexpected serialize');
      },
      hydrate(value: string, _options: { precision?: number } | null, _record: ReactiveResource): number {
        assert.ok(false, 'unexpected hydrate');
        throw new Error('unexpected hydrate');
      },
      defaultValue(_options: { precision?: number } | null, _identifier: ResourceKey): string {
        assert.ok(false, 'unexpected defaultValue');
        throw new Error('unexpected defaultValue');
      },
      [Type]: 'float',
    };

    schema.registerTransformation(FloatTransform);

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'rank',
            type: 'float',
            kind: 'attribute',
            options: { precision: 0, defaultValue: 0 },
          },
          {
            name: 'age',
            type: 'float',
            options: { precision: 0, defaultValue: 0 },
            kind: 'attribute',
          },
          {
            name: 'netWorth',
            type: 'float',
            options: { precision: 2, defaultValue: 0 },
            kind: 'attribute',
          },
          {
            name: 'coolometer',
            type: 'float',
            options: { defaultValue: 0 },
            kind: 'attribute',
          },
        ],
      })
    );

    const resource = schema.resource({ type: 'user' });
    const record = store.push(
      simplePayloadNormalize(store, this.owner, {
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
            age: '3',
            netWorth: '1000000.01',
            coolometer: '100.000',
          },
        },
      })
    ) as User;

    assert.verifySteps(['legacy deserialize:3', 'legacy deserialize:1000000.01', 'legacy deserialize:100.000']);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.equal(record.age, 3, 'age is accessible');
    assert.equal(record.netWorth, 1_000_000.01, 'netWorth is accessible');
    assert.equal(record.coolometer, 100, 'coolometer is accessible');
    assert.equal(record.rank, 0, 'rank is accessible');

    const { counters, fieldOrder } = await reactiveContext(this, record, resource);
    const nameIndex = fieldOrder.indexOf('name');

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.name, 1, 'nameCount is 1');
    assert.equal(counters.age, 1, 'ageCount is 1');
    assert.equal(counters.netWorth, 1, 'netWorthCount is 1');
    assert.equal(counters.coolometer, 1, 'coolometerCount is 1');
    assert.equal(counters.rank, 1, 'rankCount is 1');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('name: Rey Pupatine', 'name is rendered');
    assert.dom(`li:nth-child(${nameIndex + 3})`).hasText('rank: 0', 'rank is rendered');
    assert.dom(`li:nth-child(${nameIndex + 5})`).hasText('age: 3', 'age is rendered');
    assert.dom(`li:nth-child(${nameIndex + 7})`).hasText('netWorth: 1000000.01', 'netWorth is rendered');
    assert.dom(`li:nth-child(${nameIndex + 9})`).hasText('coolometer: 100', 'coolometer is rendered');

    // remote update
    store.push(
      simplePayloadNormalize(store, this.owner, {
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
            age: '4',
            netWorth: '1000000.01',
            coolometer: '100.001',
            rank: '10',
          },
        },
      })
    );

    assert.verifySteps([
      'legacy deserialize:4',
      'legacy deserialize:1000000.01',
      'legacy deserialize:100.001',
      'legacy deserialize:10',
    ]);

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(record.age, 4, 'age is accessible');
    assert.equal(record.netWorth, 1_000_000.01, 'netWorth is accessible');
    assert.equal(record.coolometer, 100.001, 'coolometer is accessible');
    assert.equal(record.rank, 10, 'rank is accessible');

    await rerender();

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.name, 2, 'nameCount is 2');
    assert.equal(counters.age, 2, 'ageCount is 2');
    assert.equal(counters.netWorth, 1, 'netWorthCount is 1');
    assert.equal(counters.coolometer, 2, 'coolometerCount is 2');
    assert.equal(counters.rank, 2, 'rankCount is 2');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('name: Rey Skybarker', 'name is rendered');
    assert.dom(`li:nth-child(${nameIndex + 3})`).hasText('rank: 10', 'rank is rendered');
    assert.dom(`li:nth-child(${nameIndex + 5})`).hasText('age: 4', 'age is rendered');
    assert.dom(`li:nth-child(${nameIndex + 7})`).hasText('netWorth: 1000000.01', 'netWorth is rendered');
    assert.dom(`li:nth-child(${nameIndex + 9})`).hasText('coolometer: 100.001', 'coolometer is rendered');
  });

  test<RenderingTestContext>('When attribute does not declare defaultValue but a matching new-style transform does, we ignore it', async function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    this.owner.register(
      'transform:float',
      class extends EmberObject {
        serialize() {
          assert.ok(false, 'unexpected legacy serialize');
        }
        deserialize(v: number | string | null) {
          assert.step(`legacy deserialize:${v}`);
          return Number(v);
        }
      }
    );

    const FloatTransform: Transformation<string | number, number> = {
      serialize(value: string | number, options: { precision?: number } | null, _record: ReactiveResource): never {
        assert.ok(false, 'unexpected serialize');
        throw new Error('unexpected serialize');
      },
      hydrate(value: string, _options: { precision?: number } | null, _record: ReactiveResource): number {
        assert.ok(false, 'unexpected hydrate');
        throw new Error('unexpected hydrate');
      },
      defaultValue(_options: { precision?: number } | null, _identifier: ResourceKey): string {
        assert.ok(false, 'unexpected defaultValue');
        throw new Error('unexpected defaultValue');
      },
      [Type]: 'float',
    };

    schema.registerTransformation(FloatTransform);

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'coolometer',
            type: 'float',
            kind: 'attribute',
          },
        ],
      })
    );

    const resource = schema.resource({ type: 'user' });
    const record = store.push(
      simplePayloadNormalize(store, this.owner, {
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Pupatine',
          },
        },
      })
    ) as User;

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Rey Pupatine', 'name is accessible');
    assert.equal(record.coolometer, undefined, 'coolometer is accessible');
    const { counters, fieldOrder } = await reactiveContext(this, record, resource);
    const nameIndex = fieldOrder.indexOf('name');

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.name, 1, 'nameCount is 1');
    assert.equal(counters.coolometer, 1, 'coolometerCount is 1');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('name: Rey Pupatine', 'name is rendered');
    assert.dom(`li:nth-child(${nameIndex + 3})`).hasText('coolometer:', 'coolometer is rendered');

    // remote update
    store.push(
      simplePayloadNormalize(store, this.owner, {
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Rey Skybarker',
          },
        },
      })
    );

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(record.coolometer, undefined, 'coolometer is accessible');

    await rerender();

    assert.equal(counters.id, 1, 'idCount is 1');
    assert.equal(counters.name, 2, 'nameCount is 2');
    assert.equal(counters.coolometer, 1, 'coolometerCount is 1');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('name: Rey Skybarker', 'name is rendered');
    assert.dom(`li:nth-child(${nameIndex + 3})`).hasText('coolometer:', 'coolometer is rendered');
  });

  test<RenderingTestContext>('id works when updated after createRecord', async function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', {});
    const resource = schema.resource({ type: 'user' });

    const { counters, fieldOrder } = await reactiveContext(this, record, resource);
    const idIndex = fieldOrder.indexOf('id');

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(counters.id, 1, 'idCount is 1');
    assert.dom(`li:nth-child(${idIndex + 1})`).hasText('id:', 'id is rendered');

    record.id = '1';
    assert.equal(record.id, '1', 'id is accessible');

    await rerender();
    assert.equal(counters.id, 2, 'idCount is 2');
    assert.dom(`li:nth-child(${idIndex + 1})`).hasText('id: 1', 'id is rendered');
  });

  test<RenderingTestContext>('id works when updated after save', async function (assert) {
    const store = new Store();
    setOwner(store, this.owner);
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
        ],
      })
    );

    const record = store.createRecord<User>('user', { name: 'Rey' });
    const identifier = recordIdentifierFor(record);
    const resource = schema.resource({ type: 'user' });

    const { counters, fieldOrder } = await reactiveContext(this, record, resource);
    const idIndex = fieldOrder.indexOf('id');

    assert.equal(record.id, null, 'id is accessible');
    assert.equal(counters.id, 1, 'idCount is 1');
    assert.dom(`li:nth-child(${idIndex + 1})`).hasText('id:', 'id is rendered');

    store.push({
      data: {
        type: 'user',
        id: '1',
        lid: identifier.lid,
        attributes: {
          name: 'Rey',
        },
      },
    });

    assert.equal(record.id, '1', 'id is accessible');
    await rerender();
    assert.equal(counters.id, 2, 'idCount is 2');
    assert.dom(`li:nth-child(${idIndex + 1})`).hasText('id: 1', 'id is rendered');
  });
});
