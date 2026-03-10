import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test, todo } from '@warp-drive/diagnostic';
import type { TestContext } from '@warp-drive/diagnostic/-types';
import { MockServerHandler } from '@warp-drive/holodeck';
import { PATCH, POST } from '@warp-drive/holodeck/mock';
import { JSONAPICache } from '@warp-drive/json-api';
import { buildBaseURL } from '@warp-drive/utilities';

interface NewUser {
  [Type]: 'user';
  id: null;
  firstName?: string;
  lastName?: string;
}

interface ExistingUser {
  [Type]: 'user';
  id: string;
  firstName: string;
  lastName: string;
  pets: ExistingPet[];
}

interface ExistingPet {
  [Type]: 'pet';
  id: string;
  name: string;
  owner: ExistingUser | null;
}

interface CustomContext extends TestContext {
  store: Store;
}

module<CustomContext>('mutation-request', function (hooks) {
  hooks.beforeEach(function () {
    const TestStore = useRecommendedStore({
      handlers: [new MockServerHandler(this)],
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { name: 'firstName', kind: 'field' },
            { name: 'lastName', kind: 'field' },
            {
              name: 'pets',
              kind: 'hasMany',
              type: 'pet',
              options: { inverse: 'owner', async: false, linksMode: true },
            },
          ],
        }),
        withDefaults({
          type: 'pet',
          fields: [
            { name: 'name', kind: 'field' },
            {
              name: 'owner',
              kind: 'belongsTo',
              type: 'user',
              options: { inverse: 'pets', async: false, linksMode: true },
            },
          ],
        }),
      ],
    });
    this.store = new TestStore();
  });

  test<CustomContext>('bulk create', async function (assert) {
    const { store } = this;
    const reqBody = JSON.stringify({
      data: [
        { type: 'user', attributes: { firstName: 'Chris' } },
        { type: 'user', attributes: { firstName: 'Tom' } },
      ],
    });
    await POST(
      this,
      '/api/user/ops/bulk.create',
      () => {
        return {
          data: [
            { type: 'user', id: 'id1', attributes: { firstName: 'Chris' } },
            { type: 'user', id: 'id2', attributes: { firstName: 'Tom' } },
          ],
        };
      },
      {
        body: reqBody,
      }
    );

    const user1 = store.createRecord<NewUser>('user', { firstName: 'Chris' });
    const lid1 = recordIdentifierFor(user1);
    const user2 = store.createRecord<NewUser>('user', { firstName: 'Tom' });
    const lid2 = recordIdentifierFor(user2);

    const url = buildBaseURL({ resourcePath: 'api/user/ops/bulk.create' });
    const records = await this.store.request(
      withReactiveResponse<ExistingUser[]>({
        op: 'createRecord',
        url,
        method: 'POST',
        body: reqBody,
        records: [lid1, lid2],
      })
    );

    const record1 = store.peekRecord<ExistingUser>(lid1);
    const record2 = store.peekRecord<ExistingUser>(lid2);

    assert.equal(records.content?.data?.length, 2, 'two records are created');
    const [created1, created2] = records.content?.data || [];
    assert.equal(record1, created1, 'first record is returned');
    assert.equal(record2, created2, 'second record is returned');
    assert.equal(record1?.firstName, 'Chris', 'first record has correct firstName');
    assert.equal(record2?.firstName, 'Tom', 'second record has correct firstName');
    assert.equal(record1?.id, 'id1', 'first record has correct id');
    assert.equal(record2?.id, 'id2', 'second record has correct id');

    // @ts-expect-error we need to fix type here
    assert.notEqual(record1, user1, 'first record is not the same as user1');
    // @ts-expect-error we need to fix type here
    assert.notEqual(record2, user2, 'second record is not the same as user2');

    // make sure the created ones updated
    assert.equal(user1?.id, 'id1', 'first record has correct id');
    assert.equal(user2?.id, 'id2', 'second record has correct id');
  });

  test<CustomContext>('update hasMany with repeated patch', async function (assert) {
    const { store } = this;
    const url = buildBaseURL({ resourcePath: 'api/user/1' });

    store.push({
      data: [
        {
          type: 'user',
          id: '1',
          attributes: { firstName: 'Chris', lastName: 'Thoburn' },
          relationships: {
            pets: {
              links: {
                self: '/api/user/1/relationships/pets',
                related: '/api/user/1/pets',
              },
              data: [{ type: 'pet', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '2',
          attributes: { firstName: 'Tom', lastName: 'Dale' },
          relationships: {
            pets: {
              links: {
                self: '/api/user/2/relationships/pets',
                related: '/api/user/2/pets',
              },
              data: [{ type: 'pet', id: '2' }],
            },
          },
        },
      ],
      included: [
        {
          type: 'pet',
          id: '1',
          attributes: { name: 'Rey' },
          relationships: {
            owner: {
              links: {
                self: '/api/pet/1/relationships/owner',
                related: '/api/pet/1/owner',
              },
              data: { type: 'user', id: '1' },
            },
          },
        },
        {
          type: 'pet',
          id: '2',
          attributes: { name: 'Pixel' },
          relationships: {
            owner: {
              links: {
                self: '/api/pet/2/relationships/owner',
                related: '/api/pet/2/owner',
              },
              data: { type: 'user', id: '2' },
            },
          },
        },
      ],
    });

    const pet1 = store.peekRecord<ExistingPet>('pet', '1');
    const pet2 = store.peekRecord<ExistingPet>('pet', '2');
    const user1 = store.peekRecord<ExistingUser>('user', '1');
    const user2 = store.peekRecord<ExistingUser>('user', '2');

    const lid = recordIdentifierFor(user1);

    const patchUser1 = async (petIds: string[]) => {
      const reqBody = JSON.stringify({
        data: {
          type: 'user',
          id: '1',
          relationships: {
            pets: {
              data: petIds.map((id) => ({ type: 'pet', id })),
            },
          },
        },
      });

      await PATCH(
        this,
        '/api/user/1',
        () => {
          return {
            data: {
              type: 'user',
              id: '1',
              attributes: { firstName: 'Chris', lastName: 'Thoburn' },
              relationships: {
                pets: {
                  links: {
                    self: '/api/user/1/relationships/pets',
                    related: '/api/user/1/pets',
                  },
                  data: petIds.map((id) => ({ type: 'pet', id })),
                },
              },
            },
          };
        },
        {
          body: reqBody,
        }
      );

      await this.store.request(
        withReactiveResponse<ExistingUser>({
          op: 'updateRecord',
          url,
          method: 'PATCH',
          body: reqBody,
          records: [lid],
        })
      );
    };

    assert.equal(pet1?.owner?.id, '1', 'first pet starts on the first user');
    assert.equal(pet2?.owner?.id, '2', 'second pet starts on the second user');
    assert.deepEqual(
      user1?.pets.map((value) => value.id),
      ['1'],
      'first user starts with the first pet'
    );
    assert.deepEqual(
      user2?.pets.map((value) => value.id),
      ['2'],
      'second user starts with the second pet'
    );

    await patchUser1(['1', '2']);

    assert.equal(pet1?.owner?.id, '1', 'first pet stays on the first user after the first patch');
    assert.equal(pet2?.owner?.id, '1', 'second pet moves to the first user after the first patch');
    assert.deepEqual(
      user1?.pets.map((value) => value.id),
      ['1', '2'],
      'first user has both pets after the first patch'
    );
    assert.deepEqual(
      user2?.pets.map((value) => value.id),
      [],
      'second user pets are cleared after the first patch'
    );

    await patchUser1(['1']);

    assert.equal(pet1?.owner?.id, '1', 'first pet stays on the first user after the second patch');
    assert.equal(pet2?.owner, null, 'second pet owner is cleared after the second patch');
    assert.deepEqual(
      user1?.pets.map((value) => value.id),
      ['1'],
      'first user is reduced to the first pet'
    );
    assert.deepEqual(
      user2?.pets.map((value) => value.id),
      [],
      'second user still has no pets after the second patch'
    );
  });

  todo('bulk delete', function (assert) {});
  todo('bulk update with 204 response', function (assert) {});
  todo('bulk-delete with 204 response', function (assert) {});
  todo('update with 204 response', function (assert) {});
  todo('delete with 204 response', function (assert) {});
});
