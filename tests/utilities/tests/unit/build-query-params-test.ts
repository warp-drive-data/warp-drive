import { buildQueryParams, sortQueryParams } from '@ember-data/request-utils';
import { module, test } from '@warp-drive/diagnostic';

module('buildQueryParams', function (hooks) {
  test('It serializes objects with stable key order', function (assert) {
    assert.equal(
      buildQueryParams({
        foo: 'bar',
        baz: 'qux',
      }),
      'baz=qux&foo=bar',
      `buildQueryParams works`
    );
    assert.equal(
      buildQueryParams({
        baz: 'qux',
        foo: 'bar',
      }),
      'baz=qux&foo=bar',
      `buildQueryParams works`
    );
  });

  test('It serializes URLSearchParams with stable key order', function (assert) {
    const params1 = new URLSearchParams();
    params1.append('foo', 'bar');
    params1.append('baz', 'qux');
    const params2 = new URLSearchParams();
    params2.append('baz', 'qux');
    params2.append('foo', 'bar');

    assert.equal(buildQueryParams(params1), 'baz=qux&foo=bar', `buildQueryParams works`);
    assert.equal(buildQueryParams(params2), 'baz=qux&foo=bar', `buildQueryParams works`);
  });

  test('It serializes objects with stable value order', function (assert) {
    assert.equal(
      buildQueryParams({
        foo: ['c', 'b', 'a'],
        baz: ['f', 'd', 'e'],
      }),
      'baz=d%2Ce%2Cf&foo=a%2Cb%2Cc',
      `buildQueryParams works`
    );
    assert.equal(
      buildQueryParams({
        foo: ['c', 'b', 'a'],
        baz: ['f', 'd', 'e'],
      }),
      'baz=d%2Ce%2Cf&foo=a%2Cb%2Cc',
      `buildQueryParams works`
    );
  });

  test('It serializes URLSearchParams with stable value order', function (assert) {
    const params1 = new URLSearchParams();
    params1.append('foo', 'c');
    params1.append('foo', 'b');
    params1.append('foo', 'a');
    params1.append('baz', 'f');
    params1.append('baz', 'd');
    params1.append('baz', 'e');
    const params2 = new URLSearchParams();
    params2.append('foo', 'c');
    params2.append('foo', 'b');
    params2.append('foo', 'a');
    params2.append('baz', 'f');
    params2.append('baz', 'd');
    params2.append('baz', 'e');

    assert.equal(buildQueryParams(params1), 'baz=d%2Ce%2Cf&foo=a%2Cb%2Cc', `buildQueryParams works`);
    assert.equal(buildQueryParams(params2), 'baz=d%2Ce%2Cf&foo=a%2Cb%2Cc', `buildQueryParams works`);
  });

  test('It special cases object.include', function (assert) {
    assert.equal(
      buildQueryParams({
        include: ['foo', 'bar'],
      }),
      'include=bar%2Cfoo',
      `buildQueryParams works`
    );
    assert.equal(
      buildQueryParams({
        include: 'foo,bar',
      }),
      'include=bar%2Cfoo',
      `buildQueryParams works`
    );
  });

  test('It allows for customizing the arrayFormat', function (assert) {
    assert.equal(
      buildQueryParams(
        {
          foo: ['c', 'b', 'a'],
          baz: ['f', 'd', 'e'],
        },
        { arrayFormat: 'bracket' }
      ),
      'baz%5B%5D=d&baz%5B%5D=e&baz%5B%5D=f&foo%5B%5D=a&foo%5B%5D=b&foo%5B%5D=c',
      `buildQueryParams works`
    );
    assert.equal(
      buildQueryParams(
        {
          foo: ['c', 'b', 'a'],
          baz: ['f', 'd', 'e'],
        },
        { arrayFormat: 'indices' }
      ),
      'baz%5B0%5D=d&baz%5B1%5D=e&baz%5B2%5D=f&foo%5B0%5D=a&foo%5B1%5D=b&foo%5B2%5D=c',
      `buildQueryParams works`
    );
    assert.equal(
      buildQueryParams(
        {
          foo: ['c', 'b', 'a'],
          baz: ['f', 'd', 'e'],
        },
        { arrayFormat: 'repeat' }
      ),
      'baz=d&baz=e&baz=f&foo=a&foo=b&foo=c',
      `buildQueryParams works`
    );
    assert.equal(
      buildQueryParams(
        {
          foo: ['c', 'b', 'a'],
          baz: ['f', 'd', 'e'],
        },
        { arrayFormat: 'comma' }
      ),
      'baz=d%2Ce%2Cf&foo=a%2Cb%2Cc',
      `buildQueryParams works`
    );
  });

  test('It does not reorder the arrays it was given', function (assert) {
    const foo = ['c', 'b', 'a'];
    const baz = ['f', 'd', 'e'];

    assert.equal(buildQueryParams({ foo, baz }), 'baz=d%2Ce%2Cf&foo=a%2Cb%2Cc', `buildQueryParams works`);

    assert.deepEqual(foo, ['c', 'b', 'a'], `foo was not sorted in place`);
    assert.deepEqual(baz, ['f', 'd', 'e'], `baz was not sorted in place`);
  });

  test('It does not reorder the arrays it was given for non-comma arrayFormats', function (assert) {
    for (const arrayFormat of ['bracket', 'indices', 'repeat', 'comma'] as const) {
      const foo = ['c', 'b', 'a'];

      buildQueryParams({ foo }, { arrayFormat });

      assert.deepEqual(foo, ['c', 'b', 'a'], `foo was not sorted in place for arrayFormat '${arrayFormat}'`);
    }
  });

  test('It does not mutate the object it was given', function (assert) {
    const params = { include: 'foo,bar', foo: ['c', 'b', 'a'] };

    assert.equal(buildQueryParams(params), 'foo=a%2Cb%2Cc&include=bar%2Cfoo', `buildQueryParams works`);

    assert.deepEqual(
      params,
      { include: 'foo,bar', foo: ['c', 'b', 'a'] },
      `the source object was not mutated, include is still a string`
    );
  });

  test('It does not reorder an include array it was given', function (assert) {
    const include = ['foo', 'bar'];

    assert.equal(buildQueryParams({ include }), 'include=bar%2Cfoo', `buildQueryParams works`);

    assert.deepEqual(include, ['foo', 'bar'], `include was not sorted in place`);
  });

  test('sortQueryParams does not mutate the object it was given', function (assert) {
    const foo = ['c', 'b', 'a'];
    const params = { include: 'foo,bar', foo };

    assert.equal(sortQueryParams(params).toString(), 'foo=a%2Cb%2Cc&include=bar%2Cfoo', `sortQueryParams works`);

    assert.deepEqual(foo, ['c', 'b', 'a'], `foo was not sorted in place`);
    assert.equal(params.include, 'foo,bar', `include is still the string it was`);
  });

  test('It produces the same output when called repeatedly with the same source', function (assert) {
    const params = { include: 'foo,bar', foo: ['c', 'b', 'a'] };

    const first = buildQueryParams(params);
    const second = buildQueryParams(params);

    assert.equal(first, second, `buildQueryParams is stable across calls`);
  });
});
