import type { CollectionEdge, ResourceEdge } from '@warp-drive/core/graph/-private';
import { graphFor } from '@warp-drive/core/graph/-private';
import { isPrivateStore } from '@warp-drive/core/store/-private';
import type { CollectionRelationship } from '@warp-drive/core/types/cache/relationship';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import Model, { attr, belongsTo, hasMany } from '@warp-drive/legacy/model';

module('Integration | Graph | Unload', function (hooks) {
  setupTest(hooks);

  module('Randomized Chaos', function () {
    test('(sync relationships) can separately safely unload related identifiers from the graph', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: false, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        if (unloadTogether) {
          store._join(() => {
            order.forEach((i) => graph.unload(i));
          });
        } else {
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when unloading identifiers in ${order.map((i) => i.id).join(',')} order during ${
            unloadTogether ? 'same run' : 'separate runs'
          }`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(sync relationships) can separately safely unload related identifiers from the graph following a delete', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: false, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        const first = order[0];
        const rest = order.slice(1);
        if (unloadTogether) {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
            rest.forEach((i) => graph.unload(i));
          });
        } else {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
          });
          rest.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when deleting ${first.id!} then unloading identifiers in ${rest
            .map((i) => i.id)
            .join(',')} order during ${unloadTogether ? 'same run' : 'separate runs'}`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(sync relationships) can separately safely unload related identifiers from the graph multiple times', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: false, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        if (unloadTogether) {
          store._join(() => {
            order.forEach((i) => graph.unload(i));
            order.forEach((i) => graph.unload(i));
          });
        } else {
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when unloading identifiers in ${order.map((i) => i.id).join(',')} order during ${
            unloadTogether ? 'same run' : 'separate runs'
          }`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(sync relationships) can separately safely unload related identifiers from the graph following a delete multiple times', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: false, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        const first = order[0];
        const rest = order.slice(1);
        if (unloadTogether) {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
            rest.forEach((i) => graph.unload(i));
            order.forEach((i) => graph.unload(i));
          });
        } else {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
          });
          rest.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when deleting ${first.id!} then unloading identifiers in ${rest
            .map((i) => i.id)
            .join(',')} order during ${unloadTogether ? 'same run' : 'separate runs'}`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Async relationships) can separately safely unload related identifiers from the graph', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: true, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        if (unloadTogether) {
          store._join(() => {
            order.forEach((i) => graph.unload(i));
          });
        } else {
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when unloading identifiers in ${order.map((i) => i.id).join(',')} order during ${
            unloadTogether ? 'same run' : 'separate runs'
          }`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Async relationships) can separately safely unload related identifiers from the graph following a delete', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: true, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        const first = order[0];
        const rest = order.slice(1);
        if (unloadTogether) {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
            rest.forEach((i) => graph.unload(i));
          });
        } else {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
          });
          rest.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when deleting ${first.id!} then unloading identifiers in ${rest
            .map((i) => i.id)
            .join(',')} order during ${unloadTogether ? 'same run' : 'separate runs'}`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Async relationships) can separately safely unload related identifiers from the graph multiple times', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: true, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        if (unloadTogether) {
          store._join(() => {
            order.forEach((i) => graph.unload(i));
            order.forEach((i) => graph.unload(i));
          });
        } else {
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when unloading identifiers in ${order.map((i) => i.id).join(',')} order during ${
            unloadTogether ? 'same run' : 'separate runs'
          }`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Async relationships) can separately safely unload related identifiers from the graph following a delete multiple times', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: true, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        const first = order[0];
        const rest = order.slice(1);
        if (unloadTogether) {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
            rest.forEach((i) => graph.unload(i));
            order.forEach((i) => graph.unload(i));
          });
        } else {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
          });
          rest.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when deleting ${first.id!} then unloading identifiers in ${rest
            .map((i) => i.id)
            .join(',')} order during ${unloadTogether ? 'same run' : 'separate runs'}`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Mixed relationships) can separately safely unload related identifiers from the graph', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        if (unloadTogether) {
          store._join(() => {
            order.forEach((i) => graph.unload(i));
          });
        } else {
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when unloading identifiers in ${order.map((i) => i.id).join(',')} order during ${
            unloadTogether ? 'same run' : 'separate runs'
          }`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Mixed relationships) can separately safely unload related identifiers from the graph following a delete', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        const first = order[0];
        const rest = order.slice(1);
        if (unloadTogether) {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
            rest.forEach((i) => graph.unload(i));
          });
        } else {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
          });
          rest.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when deleting ${first.id!} then unloading identifiers in ${rest
            .map((i) => i.id)
            .join(',')} order during ${unloadTogether ? 'same run' : 'separate runs'}`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Mixed relationships) can separately safely unload related identifiers from the graph multiple times', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        if (unloadTogether) {
          store._join(() => {
            order.forEach((i) => graph.unload(i));
            order.forEach((i) => graph.unload(i));
          });
        } else {
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when unloading identifiers in ${order.map((i) => i.id).join(',')} order during ${
            unloadTogether ? 'same run' : 'separate runs'
          }`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });

    test('(Mixed relationships) can separately safely unload related identifiers from the graph following a delete multiple times', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: 'bestFriend' }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      function permutation(order: ResourceKey[], unloadTogether: boolean) {
        store._join(() => {
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'bestFriend',
            value: { data: identifier2 },
          });
          graph.push({
            op: 'updateRelationship',
            record: identifier,
            field: 'worstFriend',
            value: { data: identifier3 },
          });
        });

        const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
        const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
        const worstFriend = graph.get(identifier, 'worstFriend') as ResourceEdge;

        assert.equal(bestFriend.localState, identifier2, 'precond - bestFriend is set');
        assert.equal(bestFriend.remoteState, identifier2, 'precond - bestFriend is set');
        assert.equal(worstFriend.localState, identifier3, 'precond - worstFriend is set');
        assert.equal(worstFriend.remoteState, identifier3, 'precond - worstFriend is set');
        assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
        assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');

        const first = order[0];
        const rest = order.slice(1);
        if (unloadTogether) {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
            rest.forEach((i) => graph.unload(i));
            order.forEach((i) => graph.unload(i));
          });
        } else {
          store._join(() => {
            graph.push({
              op: 'deleteRecord',
              record: first,
              isNew: false,
            });
          });
          rest.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
          order.forEach((i) => {
            store._join(() => {
              graph.unload(i);
            });
          });
        }
        assert.ok(
          true,
          `did not throw when deleting ${first.id!} then unloading identifiers in ${rest
            .map((i) => i.id)
            .join(',')} order during ${unloadTogether ? 'same run' : 'separate runs'}`
        );
      }

      permutation([identifier, identifier2, identifier3], true);
      permutation([identifier, identifier3, identifier2], true);
      permutation([identifier2, identifier, identifier3], true);
      permutation([identifier2, identifier3, identifier], true);
      permutation([identifier3, identifier, identifier2], true);
      permutation([identifier3, identifier2, identifier], true);
      permutation([identifier, identifier2, identifier3], false);
      permutation([identifier, identifier3, identifier2], false);
      permutation([identifier2, identifier, identifier3], false);
      permutation([identifier2, identifier3, identifier], false);
      permutation([identifier3, identifier, identifier2], false);
      permutation([identifier3, identifier2, identifier], false);
    });
  });

  module('Specific Scenarios', function () {
    test('Unload of a record with a deleted implicitly related record', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;
      class User extends Model {
        @attr declare name: string;
        @belongsTo('user', { async: false, inverse: null }) declare bestFriend: User | null;
        @belongsTo('user', { async: true, inverse: null }) declare worstFriend: User | null;
      }
      owner.register('model:user', User);

      const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const identifier2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const identifier3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      store._join(() => {
        graph.push({
          op: 'updateRelationship',
          record: identifier2,
          field: 'bestFriend',
          value: { data: identifier },
        });
        graph.push({
          op: 'updateRelationship',
          record: identifier3,
          field: 'worstFriend',
          value: { data: identifier },
        });
      });

      const bestFriend = graph.get(identifier, 'bestFriend') as ResourceEdge;
      const bestFriend2 = graph.get(identifier2, 'bestFriend') as ResourceEdge;
      const worstFriend3 = graph.get(identifier3, 'worstFriend') as ResourceEdge;

      assert.equal(bestFriend2.localState, identifier, 'precond - bestFriend is set');
      assert.equal(bestFriend2.remoteState, identifier, 'precond - bestFriend is set');
      assert.equal(worstFriend3.localState, identifier, 'precond - worstFriend is set');
      assert.equal(worstFriend3.remoteState, identifier, 'precond - worstFriend is set');
      assert.equal(bestFriend.localState, null, 'precond - bestFriend is not set');
      assert.equal(bestFriend.remoteState, null, 'precond - bestFriend is not set');

      store._join(() => {
        graph.push({
          op: 'deleteRecord',
          record: identifier2,
          isNew: false,
        });
        graph.push({
          op: 'deleteRecord',
          record: identifier3,
          isNew: false,
        });
      });

      store._join(() => {
        graph.unload(identifier);
      });

      assert.ok(true, 'did not throw when unloading identifier');
    });
  });

  module('hasMany localState recovery (issue #10532)', function () {
    test('reading a sync hasMany after the record is unloaded does not throw', function (assert) {
      const store = isPrivateStore(this.owner.lookup('service:store'));
      const graph = graphFor(store);
      const { owner } = this;
      const { cacheKeyManager } = store;

      class User extends Model {
        @attr declare name: string;
        @hasMany('user', { async: false, inverse: 'friends' }) declare friends: User[];
      }
      owner.register('model:user', User);

      const user1 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
      const user2 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' });
      const user3 = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '3' });

      store._join(() => {
        graph.push({
          op: 'updateRelationship',
          record: user1,
          field: 'friends',
          value: { data: [user2, user3] },
        });
      });

      const friends = graph.get(user1, 'friends') as CollectionEdge;
      assert.true(friends.state.hasReceivedData, 'precond - friends has received data');

      // Materialize localState first so the edge is clean (isDirty: false). This
      // mirrors a relationship that has already been read once.
      graph.getData(user1, 'friends');
      assert.false(friends.isDirty, 'precond - edge is clean after first read');
      assert.deepEqual(friends.localState, [user2, user3], 'precond - localState materialized');

      // Unloading the record dematerializes its edges but retains the nodes for
      // rematerialization. For a sync-inverse hasMany this clears localState to
      // null and remoteState to [] without touching isDirty -- leaving the
      // inconsistent state ({ isDirty: false, localState: null }) with
      // hasReceivedData still true. Reading the edge then previously threw
      // "Expected localState to be present" (e.g. via dirty-state rollback).
      store._join(() => {
        graph.unload(user1);
      });

      assert.equal(friends.localState, null, 'precond - localState was cleared');
      assert.false(friends.isDirty, 'precond - edge is not dirty');
      assert.true(friends.state.hasReceivedData, 'precond - edge still reports received data');

      let data: CollectionRelationship | undefined;
      try {
        data = graph.getData(user1, 'friends') as CollectionRelationship;
        assert.ok(true, 'reading the relationship did not throw');
      } catch (e) {
        assert.ok(false, `reading the relationship should not throw, received ${(e as Error).message}`);
      }

      assert.deepEqual(data?.data, [], 'the relationship reads back as empty');
    });
  });
});
