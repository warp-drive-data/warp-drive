import { module, test } from '@warp-drive/diagnostic';
import type { PageHints } from '@warp-drive/experiments/pagination';
import {
  clearPaginationCache,
  defaultPageHints,
  getPaginationLinks,
  getPaginationState,
} from '@warp-drive/experiments/pagination';

module('Unit | pagination | entry point', function () {
  test('exports the pagination API, with types that resolve', function (assert) {
    const hints: PageHints = defaultPageHints;

    assert.equal(typeof getPaginationState, 'function');
    assert.equal(typeof getPaginationLinks, 'function');
    assert.equal(typeof clearPaginationCache, 'function');
    assert.equal(typeof hints, 'function');
  });
});
