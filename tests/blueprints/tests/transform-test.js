'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('mocha');

const { generateTransformSource } = require('warp-drive/generators/transform');
const { generateUnitTestSource } = require('warp-drive/generators/tests');

const fixture = require('./helpers/fixture.js');

describe('generate: transform', function () {
  it('transform', function () {
    const source = generateTransformSource('foo');

    assert.match(source, /export default class FooTransform \{/);
    assert.match(source, /deserialize\(serialized\) \{/);
    assert.match(source, /serialize\(deserialized\) \{/);
  });

  it('transform-test', function () {
    const source = generateUnitTestSource('Transform', 'foo', 'my-app');
    assert.equal(source, fixture('transform-test/default.js'));
  });

  it('transform-test in addon', function () {
    const source = generateUnitTestSource('Transform', 'foo', 'dummy');
    assert.equal(source, fixture('transform-test/addon-default.js'));
  });
});
