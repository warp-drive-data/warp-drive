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

  test('two belongsTo relationships that both declare themselves as the inverse of the same hasMany produce a clear error', function (assert) {
    const { owner } = this;
    const { cacheKeyManager } = store;

    // A `container` has a single hasMany `x` (inverse `one`). Two separate
    // `gadget` belongsTo relationships (`one` and `two`) both incorrectly claim
    // to be the inverse of `container.x`.
    class Container extends Model {
      @hasMany('gadget', { async: false, inverse: 'one' }) declare x: unknown;
    }
    class Gadget extends Model {
      @belongsTo('container', { async: false, inverse: 'x' }) declare one: unknown;
      @belongsTo('container', { async: false, inverse: 'x' }) declare two: unknown;
    }
    owner.register('model:container', Container);
    owner.register('model:gadget', Gadget);

    const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'gadget', id: '1' });

    // resolving `one` first claims the `container.x` inverse
    graph.get(identifier, 'one');

    // resolving `two` should surface the misconfiguration clearly instead of
    // silently reusing `one`'s relationship definition
    assert.throws(
      () => {
        graph.get(identifier, 'two');
      },
      /Both 'gadget\.one' and 'gadget\.two' declare 'inverse: "x"'/,
      'a clear assertion is thrown identifying both conflicting relationships'
    );
  });

  test('two hasMany relationships that declare the same explicit inverse still error when that inverse itself declares an explicit (guessed) inverse', function (assert) {
    const { owner } = this;
    const { cacheKeyManager } = store;

    // A `crate` has two separate hasMany relationships to `widget` (`one` and `two`)
    // that both (incorrectly) claim to be the inverse of `widget.X`. Unlike the
    // first test, `widget.X` itself declares an explicit (and only partially
    // correct) inverse rather than `null`.
    class Crate extends Model {
      @hasMany('widget', { async: false, inverse: 'X' }) declare one: unknown;
      @hasMany('widget', { async: false, inverse: 'X' }) declare two: unknown;
    }
    class Widget extends Model {
      @belongsTo('crate', { async: false, inverse: 'one' }) declare X: unknown;
    }
    owner.register('model:crate', Crate);
    owner.register('model:widget', Widget);

    const identifier = cacheKeyManager.getOrCreateRecordIdentifier({ type: 'crate', id: '1' });

    // resolving `one` first claims the `widget.X` inverse
    graph.get(identifier, 'one');

    // resolving `two` should surface the misconfiguration clearly instead of
    // silently reusing `one`'s relationship definition
    assert.throws(
      () => {
        graph.get(identifier, 'two');
      },
      /Both 'crate\.one' and 'crate\.two' declare 'inverse: "X"'/,
      'a clear assertion is thrown identifying both conflicting relationships'
    );
  });
});
