import { module, test } from '@warp-drive/diagnostic/ember';
import { withArrayDefaults } from '@warp-drive/legacy/model-fragments';

module('Unit | withArrayDefaults', function () {
  test('Creates correct schema for an array with primitiveType', function (assert) {
    assert.deepEqual(withArrayDefaults('titles', 'string'), {
      kind: 'array' as const,
      name: 'titles',
      type: 'array:string',
      options: {
        arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
      },
    });
  });

  test('Creates correct schema for an array without primitiveType', function (assert) {
    assert.deepEqual(withArrayDefaults('titles'), {
      kind: 'array' as const,
      name: 'titles',
      type: 'array',
      options: {
        arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
      },
    });
  });
});
