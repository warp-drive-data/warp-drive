import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveResource } from '@warp-drive/core/reactive';
import { withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import { module, setupRenderingTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

import { reactiveContext } from '../-utils/reactive-context';

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

module('Reactivity | derivation', function (hooks) {
  setupRenderingTest(hooks);

  test('we can derive from simple fields', async function (assert) {
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

    const resource = schema.resource({ type: 'user' });
    const record = store.push({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          firstName: 'Rey',
          lastName: 'Pupatine',
        },
      },
    }) as User;

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.firstName, 'Rey', 'firstName is accessible');
    assert.equal(record.lastName, 'Pupatine', 'lastName is accessible');
    assert.equal(record.fullName, 'Rey Pupatine', 'fullName is accessible');

    const { counters, fieldOrder } = await reactiveContext(record, resource);
    const nameIndex = fieldOrder.indexOf('firstName');

    assert.equal(counters.id, 1, 'id Count is 1');
    assert.equal(counters.$type, 1, '$type Count is 1');
    assert.equal(counters.firstName, 1, 'firstName Count is 1');
    assert.equal(counters.lastName, 1, 'lastName Count is 1');
    assert.equal(counters.fullName, 1, 'fullName Count is 1');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('firstName: Rey', 'firstName is rendered');
    assert.dom(`li:nth-child(${nameIndex + 3})`).hasText('lastName: Pupatine', 'lastName is rendered');
    assert.dom(`li:nth-child(${nameIndex + 5})`).hasText('fullName: Rey Pupatine', 'fullName is rendered');

    store.push({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          firstName: 'Rey',
          lastName: 'Skybarker',
        },
      },
    });

    assert.equal(record.firstName, 'Rey', 'firstName is accessible');
    assert.equal(record.lastName, 'Skybarker', 'lastName is accessible');
    assert.equal(record.fullName, 'Rey Skybarker', 'fullName is accessible');

    await this.h.rerender();

    assert.equal(counters.id, 1, 'id Count is 1');
    assert.equal(counters.$type, 1, '$type Count is 1');
    assert.equal(counters.firstName, 1, 'firstName Count is 1');
    assert.equal(counters.lastName, 2, 'lastName Count is 2');
    assert.equal(counters.fullName, 2, 'fullName Count is 2');

    assert.dom(`li:nth-child(${nameIndex + 1})`).hasText('firstName: Rey', 'firstName is rendered');
    assert.dom(`li:nth-child(${nameIndex + 3})`).hasText('lastName: Skybarker', 'lastName is rendered');
    assert.dom(`li:nth-child(${nameIndex + 5})`).hasText('fullName: Rey Skybarker', 'fullName is rendered');
  });

  test('derivations do not re-run unless the tracked state they consume is dirtied', function (assert) {
    const store = new Store();
    const { schema } = store;

    function concat(
      record: ReactiveResource & { [key: string]: unknown },
      options: Record<string, unknown> | null,
      _prop: string
    ): string {
      if (!options) throw new Error(`options is required`);
      const opts = options as { fields: string[]; separator?: string };
      const result = opts.fields.map((field) => record[field]).join(opts.separator ?? '');
      assert.step(`concat: ${result}`);
      return result;
    }
    concat[Type] = 'concat';

    schema.registerDerivation(concat);
    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'age',
            kind: 'field',
          },
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
        id: '1',
        type: 'user',
        attributes: {
          age: 3,
          firstName: 'Rey',
          lastName: 'Pupatine',
        },
      },
    }) as User;

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.firstName, 'Rey', 'firstName is accessible');
    assert.equal(record.lastName, 'Pupatine', 'lastName is accessible');
    assert.verifySteps([], 'no concat yet');
    assert.equal(record.fullName, 'Rey Pupatine', 'fullName is accessible');
    assert.verifySteps(['concat: Rey Pupatine'], 'concat happened');
    assert.equal(record.fullName, 'Rey Pupatine', 'fullName is accessible');
    assert.verifySteps([], 'no additional concat');

    store.push({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          age: 4,
          firstName: 'Rey',
          lastName: 'Pupatine', // NO CHANGE
        },
      },
    }) as User;

    assert.equal(record.fullName, 'Rey Pupatine', 'fullName is accessible');
    assert.verifySteps([], 'no additional concat');

    store.push({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          age: 5,
          firstName: 'Rey',
          lastName: 'Porcupine', // NOW A CHANGE
        },
      },
    }) as User;

    assert.equal(record.fullName, 'Rey Porcupine', 'fullName is accessible');

    assert.verifySteps(['concat: Rey Porcupine'], 'it recomputed!');
  });
});
