'use strict';

const assert = require('node:assert/strict');
const { describe, it, afterEach } = require('mocha');

const { generateSerializerSource } = require('warp-drive/generators/serializer');
const { generateUnitTestSource } = require('warp-drive/generators/tests');

const fixture = require('./helpers/fixture.js');
const { makeTmpProject, withApplicationEntity, cleanup } = require('./helpers/tmp-project.js');

describe('generate: serializer', function () {
  let cwd;

  afterEach(function () {
    if (cwd) {
      cleanup(cwd);
      cwd = undefined;
    }
  });

  it('serializer', function () {
    cwd = makeTmpProject();
    const source = generateSerializerSource('foo', { cwd, isAddon: false });

    assert.match(source, /import JSONAPISerializer from '@ember-data\/serializer\/json-api';/);
    assert.match(source, /export default class FooSerializer extends JSONAPISerializer \{/);
  });

  it('serializer extends application serializer if it exists', function () {
    cwd = makeTmpProject();
    withApplicationEntity(cwd, 'serializer');
    const source = generateSerializerSource('foo', { cwd, isAddon: false });

    assert.match(source, /import ApplicationSerializer from '\.\/application';/);
    assert.match(source, /export default class FooSerializer extends ApplicationSerializer \{/);
  });

  it('addon serializers do not auto-extend from an application serializer', function () {
    cwd = makeTmpProject();
    withApplicationEntity(cwd, 'serializer');
    const source = generateSerializerSource('foo', { cwd, isAddon: true });

    assert.match(source, /import JSONAPISerializer from '@ember-data\/serializer\/json-api';/);
    assert.match(source, /export default class FooSerializer extends JSONAPISerializer \{/);
  });

  it('serializer with --base-class', function () {
    cwd = makeTmpProject();
    const source = generateSerializerSource('foo', { cwd, isAddon: false, baseClass: 'bar' });

    assert.match(source, /import BarSerializer from '\.\/bar';/);
    assert.match(source, /export default class FooSerializer extends BarSerializer \{/);
  });

  it('serializer throws when --base-class is the same as the entity name', function () {
    cwd = makeTmpProject();
    assert.throws(
      () => generateSerializerSource('foo', { cwd, isAddon: false, baseClass: 'foo' }),
      /Serializers cannot extend from themself/
    );
  });

  it('serializer when named "application"', function () {
    cwd = makeTmpProject();
    const source = generateSerializerSource('application', { cwd, isAddon: false });

    assert.match(source, /import JSONAPISerializer from '@ember-data\/serializer\/json-api';/);
    assert.match(source, /export default class ApplicationSerializer extends JSONAPISerializer \{/);
  });

  it('serializer-test', function () {
    const source = generateUnitTestSource('Serializer', 'foo', 'my-app');
    assert.equal(source, fixture('serializer-test/foo-default.js'));
  });

  it('serializer-test for application', function () {
    const source = generateUnitTestSource('Serializer', 'application', 'my-app');
    assert.equal(source, fixture('serializer-test/application-default.js'));
  });

  it('serializer-test in addon', function () {
    const source = generateUnitTestSource('Serializer', 'foo', 'dummy');
    assert.equal(source, fixture('serializer-test/addon-default.js'));
  });
});
