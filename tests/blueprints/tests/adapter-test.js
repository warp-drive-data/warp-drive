'use strict';

const assert = require('node:assert/strict');
const { describe, it, afterEach } = require('mocha');

const { generateAdapterSource } = require('warp-drive/generators/adapter');
const { generateUnitTestSource } = require('warp-drive/generators/tests');

const fixture = require('./helpers/fixture.js');
const { makeTmpProject, withApplicationEntity, cleanup } = require('./helpers/tmp-project.js');

describe('generate: adapter', function () {
  let cwd;

  afterEach(function () {
    if (cwd) {
      cleanup(cwd);
      cwd = undefined;
    }
  });

  it('adapter', function () {
    cwd = makeTmpProject();
    const source = generateAdapterSource('foo', { cwd, isAddon: false });

    assert.match(source, /import JSONAPIAdapter from '@ember-data\/adapter\/json-api';/);
    assert.match(source, /export default class FooAdapter extends JSONAPIAdapter \{/);
  });

  it('adapter extends application adapter if it exists', function () {
    cwd = makeTmpProject();
    withApplicationEntity(cwd, 'adapter');
    const source = generateAdapterSource('foo', { cwd, isAddon: false });

    assert.match(source, /import ApplicationAdapter from '\.\/application';/);
    assert.match(source, /export default class FooAdapter extends ApplicationAdapter \{/);
  });

  it('addon adapters do not auto-extend from an application adapter', function () {
    cwd = makeTmpProject();
    withApplicationEntity(cwd, 'adapter');
    const source = generateAdapterSource('foo', { cwd, isAddon: true });

    assert.match(source, /import JSONAPIAdapter from '@ember-data\/adapter\/json-api';/);
    assert.match(source, /export default class FooAdapter extends JSONAPIAdapter \{/);
  });

  it('adapter with --base-class', function () {
    cwd = makeTmpProject();
    const source = generateAdapterSource('foo', { cwd, isAddon: false, baseClass: 'bar' });

    assert.match(source, /import BarAdapter from '\.\/bar';/);
    assert.match(source, /export default class FooAdapter extends BarAdapter \{/);
  });

  it('adapter throws when --base-class is the same as the entity name', function () {
    cwd = makeTmpProject();
    assert.throws(
      () => generateAdapterSource('foo', { cwd, isAddon: false, baseClass: 'foo' }),
      /Adapters cannot extend from themself/
    );
  });

  it('adapter when named "application"', function () {
    cwd = makeTmpProject();
    const source = generateAdapterSource('application', { cwd, isAddon: false });

    assert.match(source, /import JSONAPIAdapter from '@ember-data\/adapter\/json-api';/);
    assert.match(source, /export default class ApplicationAdapter extends JSONAPIAdapter \{/);
  });

  it('adapter-test', function () {
    const source = generateUnitTestSource('Adapter', 'foo', 'my-app');
    assert.equal(source, fixture('adapter-test/foo-default.js'));
  });

  it('adapter-test for application', function () {
    const source = generateUnitTestSource('Adapter', 'application', 'my-app');
    assert.equal(source, fixture('adapter-test/application-default.js'));
  });

  it('adapter-test in addon', function () {
    const source = generateUnitTestSource('Adapter', 'foo', 'dummy');
    assert.equal(source, fixture('adapter-test/addon-default.js'));
  });
});
