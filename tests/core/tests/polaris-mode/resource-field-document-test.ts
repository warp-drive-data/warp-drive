import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveDocument } from '@warp-drive/core/reactive';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { Context } from '@warp-drive/core/request';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

interface User {
  id: string;
  $type: 'user';
  name: string;
  pet: ReactiveDocument<Pet | null>;
  [Type]: 'user';
}

interface Pet {
  id: string;
  $type: 'pet';
  name: string;
  owner: ReactiveDocument<User | null>;
  [Type]: 'pet';
}

const PET_LINK = '/users/1/pet';

/**
 * A store whose requests are answered from `responses` by url, recording each url requested.
 */
function setupStore(responses: Record<string, unknown> = {}) {
  const requested: string[] = [];
  const handler = {
    request<T>(context: Context): Promise<T> {
      const url = context.request.url!;
      requested.push(url);
      return Promise.resolve(responses[url] as T);
    },
  };
  const TestStore = useRecommendedStore({
    cache: JSONAPICache,
    handlers: [handler],
    schemas: [
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'pet', type: 'pet', kind: 'resource', options: { async: true, inverse: 'owner' } },
        ],
      }),
      withDefaults({
        type: 'pet',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'owner', type: 'user', kind: 'resource', options: { async: true, inverse: 'pet' } },
        ],
      }),
    ],
  });
  return { store: new TestStore(), requested };
}

/**
 * Pushes user 1 with pet 1 as its pet, reached through the related link {@link PET_LINK}.
 */
function pushUserWithPet(store: ReturnType<typeof setupStore>['store']) {
  const user = store.push<User>({
    data: {
      type: 'user',
      id: '1',
      attributes: { name: 'Chris' },
      relationships: {
        pet: { data: { type: 'pet', id: '1' }, links: { related: PET_LINK }, meta: { since: 2020 } },
      },
    },
    included: [{ type: 'pet', id: '1', attributes: { name: 'Shen' } }],
  });
  return { user, shen: store.peekRecord<Pet>('pet', '1')! };
}

function petResponse(id: string, name: string) {
  return { data: { type: 'pet', id, attributes: { name } } };
}

module('Reads | resource field documents', function (hooks) {
  setupTest(hooks);

  test('a resource field is a stable document of its relationship', function (assert) {
    const { store } = setupStore();
    const { user, shen } = pushUserWithPet(store);

    const doc = user.pet;
    assert.equal(doc, user.pet, 'the field returns the same document on every read');
    assert.equal(doc.data, shen, 'data is the related record');
    assert.deepEqual(doc.links, { related: PET_LINK }, 'links are the relationship links');
    assert.deepEqual(doc.meta, { since: 2020 }, 'meta is the relationship meta');
    assert.equal(
      doc.identifier,
      store.cacheKeyManager.getOrCreateDocumentIdentifier({ url: PET_LINK, method: 'GET' }),
      'identifier is the request key for the related link'
    );
  });

  test('fetch() applies the response to the relationship and resolves with the same document', async function (assert) {
    const { store, requested } = setupStore({ [PET_LINK]: petResponse('2', 'Rey') });
    const { user, shen } = pushUserWithPet(store);

    const doc = await user.pet.fetch();
    const rey = store.peekRecord<Pet>('pet', '2')!;

    assert.deepEqual(requested, [PET_LINK], 'the related link was requested');
    assert.equal(doc, user.pet, 'fetch() resolves with the relationship document');
    assert.equal(user.pet.data, rey, 'the response is the relationship membership');
    assert.equal(rey.owner.data, user, 'the new member sees the relationship through its inverse');
    assert.equal(shen.owner.data, null, 'the prior member no longer does');
  });

  test('a top-level request for the related link updates the relationship', async function (assert) {
    const { store } = setupStore({ [PET_LINK]: petResponse('2', 'Rey') });
    const { user } = pushUserWithPet(store);

    const { content } = await store.request<ReactiveDocument<Pet | null>>({ url: PET_LINK, method: 'GET' });
    const rey = store.peekRecord<Pet>('pet', '2')!;

    assert.equal(content.data, rey, 'the request document has the response membership');
    assert.equal(user.pet.data, rey, 'the relationship has the response membership');
  });

  test('the request document for the related link follows later changes to the relationship', async function (assert) {
    const { store } = setupStore({ [PET_LINK]: petResponse('2', 'Rey') });
    const { user } = pushUserWithPet(store);
    const { content } = await store.request<ReactiveDocument<Pet | null>>({ url: PET_LINK, method: 'GET' });

    // a payload for the parent resource
    store.push({
      data: {
        type: 'user',
        id: '1',
        relationships: { pet: { data: { type: 'pet', id: '3' }, links: { related: PET_LINK } } },
      },
      included: [{ type: 'pet', id: '3', attributes: { name: 'Pupper' } }],
    });
    const pupper = store.peekRecord<Pet>('pet', '3')!;
    assert.equal(content.data, pupper, 'a parent payload updates the request document');

    // a payload for the inverse
    store.push({
      data: {
        type: 'pet',
        id: '4',
        attributes: { name: 'Shuri' },
        relationships: { owner: { data: { type: 'user', id: '1' } } },
      },
    });
    const shuri = store.peekRecord<Pet>('pet', '4')!;
    assert.equal(user.pet.data, shuri, 'an inverse payload updates the relationship');
    assert.equal(content.data, shuri, 'an inverse payload updates the request document');
  });

  test('a local edit shows on the editable document only', async function (assert) {
    const { store } = setupStore({ [PET_LINK]: petResponse('1', 'Shen') });
    const { user, shen } = pushUserWithPet(store);
    const { content } = await store.request<ReactiveDocument<Pet | null>>({ url: PET_LINK, method: 'GET' });
    const rey = store.push<Pet>({ data: { type: 'pet', id: '2', attributes: { name: 'Rey' } } });

    const editable = await checkout<User>(user);
    // the public type of `data` is readonly; only a relationship document on an editable resource accepts writes
    (editable.pet as { data: Pet | null }).data = rey;

    assert.equal(editable.pet.data, rey, 'the editable document shows the local state');
    assert.equal(user.pet.data, shen, 'the immutable document shows the remote state');
    assert.equal(content.data, shen, 'the request document shows the remote state');
  });

  test('the field itself cannot be assigned', async function (assert) {
    const { store } = setupStore();
    const { user } = pushUserWithPet(store);
    const editable = await checkout<User>(user);

    await assert.expectAssertion(() => {
      (editable as unknown as { pet: null }).pet = null;
    }, /Set `data` on the relationship document instead/);
  });
});
