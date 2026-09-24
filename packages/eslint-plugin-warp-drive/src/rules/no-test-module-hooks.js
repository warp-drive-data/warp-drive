/**
 * {@include ./no-test-module-hooks.md}
 * @module
 */
// @ts-check

const messageId = 'noTestModuleHooks';
const hookCallSelector =
  'CallExpression[callee.type="MemberExpression"][callee.object.name="hooks"][callee.property.name=/^(beforeEach|afterEach)$/]';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `hooks.beforeEach`/`hooks.afterEach` in favor of setup functions each test calls explicitly',
      category: 'Possible Performance Issues',
      recommended: false,
      url: 'https://github.com/warp-drive-data/warp-drive/tree/main/packages/eslint-plugin-warp-drive/docs/no-test-module-hooks.md',
    },
    schema: false,
    messages: {
      [messageId]:
        '`hooks.{{method}}` runs for every test in this module, even ones that do not need its setup. ' +
        'Extract the setup into a plain function and call it explicitly from the tests that need it.',
    },
  },

  create(context) {
    return {
      /**
       * `hookCallSelector` matches only `hooks.beforeEach(...)` and
       * `hooks.afterEach(...)`, so `callee` is always a `MemberExpression` whose
       * property is the method `Identifier`. `Rule.Node` is a union over every
       * node type and can't express that, hence the intersection.
       * @param {import('eslint').Rule.Node & { callee: { property: { name: string } } }} node
       */
      [hookCallSelector](node) {
        context.report({
          node,
          messageId,
          data: { method: node.callee.property.name },
        });
      },
    };
  },
};
