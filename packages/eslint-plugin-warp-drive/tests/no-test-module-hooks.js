// @ts-nocheck
const rule = require('../src/rules/no-test-module-hooks');
const RuleTester = require('eslint').RuleTester;

const eslintTester = new RuleTester({
  languageOptions: {
    parser: require('@babel/eslint-parser'),
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      requireConfigFile: false,
      babelOptions: {
        babelrc: false,
        configFile: false,
        plugins: [[require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }]],
      },
    },
  },
});

const msg = 'noTestModuleHooks';

eslintTester.run('no-test-module-hooks', rule, {
  valid: [
    // no hooks usage at all
    {
      code: `
        module('foo', function () {
          test('a', function (assert) {
            assert.ok(true);
          });
        });
      `,
    },
    // setup extracted into a plain function each test calls explicitly
    {
      code: `
        function setupStore() {
          return new Store();
        }
        module('foo', function () {
          test('a', function (assert) {
            const store = setupStore();
            assert.ok(store);
          });
        });
      `,
    },
    // setupTest/setupRenderingTest are plain calls, not \`.beforeEach\`/\`.afterEach\`
    {
      code: `
        module('foo', function (hooks) {
          setupTest(hooks);
          test('a', function (assert) {
            assert.ok(true);
          });
        });
      `,
    },
    // an unrelated object that happens to have these method names, but isn't named \`hooks\`
    {
      code: `
        lifecycle.beforeEach(function () {
          doSomething();
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        module('foo', function (hooks) {
          hooks.beforeEach(function () {
            this.store = new Store();
          });
          test('a', function (assert) {
            assert.ok(this.store);
          });
        });
      `,
      errors: [{ messageId: msg, data: { method: 'beforeEach' } }],
    },
    {
      code: `
        module('foo', function (hooks) {
          hooks.afterEach(function () {
            cleanup();
          });
          test('a', function (assert) {
            assert.ok(true);
          });
        });
      `,
      errors: [{ messageId: msg, data: { method: 'afterEach' } }],
    },
    // both hooks in the same module report separately
    {
      code: `
        module('foo', function (hooks) {
          hooks.beforeEach(function () {
            this.store = new Store();
          });
          hooks.afterEach(function () {
            cleanup();
          });
          test('a', function (assert) {
            assert.ok(this.store);
          });
        });
      `,
      errors: [
        { messageId: msg, data: { method: 'beforeEach' } },
        { messageId: msg, data: { method: 'afterEach' } },
      ],
    },
  ],
});
