import type { Graph } from '@warp-drive/core/graph/-private';
import { graphFor } from '@warp-drive/core/graph/-private';
import type { PrivateStore } from '@warp-drive/core/store/-private';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import Model, { belongsTo, hasMany } from '@warp-drive/legacy/model';

module('Integration | Graph | Duplicate Inverse Configuration', function (hooks) {
  setupTest(hooks);

  let store: PrivateStore;
  let graph: Graph;
  hooks.beforeEach(function () {
    const { owner } = this;
    store = owner.lookup('service:store') as PrivateStore;
    graph = graphFor(store);
  });

  test('two relationships that declare the same explicit inverse produce a clear error instead of a corrupted relationship', function (assert) {
    const { owner } = this;
    const { cacheKeyManager } = store;

    // A `nest` has two separate hasMany relationships to `mod-action` that both
    // (incorrectly) claim to be the inverse of `mod-action.subject`. Only one of
    // them can actually be satisfied by that single foreign key.
    class Nest extends Model {
      @hasMany('mod-action', { async: false, inverse: 'subject' }) declare blocking: unknown;
      @hasMany('mod-action', { async: false, inverse: 'subject' }) declare muting: unknown;
    }
    class ModAction extends Model {
      @belongsTo('nest', { async: false, inverse: null }) declare subject: unknown;
    }
    owner.register('model:nest', Nest);
    owner.register('model:mod-action', ModAction);

    const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'nest', id: '1' });

    // resolving `blocking` first claims the `mod-action.subject` inverse
    graph.get(identifier, 'blocking');

    // resolving `muting` should surface the misconfiguration clearly instead of
    // silently reusing `blocking`'s relationship definition (which previously led
    // to misleading downstream errors like "nest.muting is a belongsTo")
    assert.throws(
      () => {
        graph.get(identifier, 'muting');
      },
      /Both 'nest\.blocking' and 'nest\.muting' declare 'inverse: "subject"'/,
      'a clear assertion is thrown identifying both conflicting relationships'
    );
  });
});
