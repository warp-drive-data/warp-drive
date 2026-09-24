/**
 * {@include ./template-require-request-error-block.md}
 * @module
 */
'use strict';

const ERROR_BLOCK_TAG = ':error';
const TRACKED_TAGS = new Set(['Request', 'Await']);

const messages = {
  noErrorBlock:
    'Using <{{tag}}> without an :error block means that if the request/promise rejects, the ' +
    'error is thrown and can crash the app. Add an :error block to <{{tag}}> to handle the ' +
    'failure case explicitly.',
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures <Request>/<Await> always provide an :error block',
      category: 'Possible Errors',
      recommended: false,
      url: 'https://github.com/warp-drive-data/warp-drive/tree/main/packages/eslint-plugin-warp-drive/docs/template-require-request-error-block.md',
    },
    schema: [],
    messages,
  },

  create(context) {
    // This rule visits the Glimmer template AST that `ember-eslint-parser` exposes to
    // ESLint for `.gjs`/`.gts` files, using `Glimmer`-prefixed node types that otherwise
    // match `@glimmer/syntax`'s AST shape 1:1 (e.g. `GlimmerElementNode.tag`). Unlike
    // `template-always-use-request-content`, this rule only needs to check for the
    // presence of an `:error` named block, so no usage/shadow tracking is needed.
    return {
      GlimmerElementNode(node) {
        if (!TRACKED_TAGS.has(node.tag)) return;

        const hasErrorBlock = node.children.some(
          (child) => child.type === 'GlimmerElementNode' && child.tag === ERROR_BLOCK_TAG
        );

        if (!hasErrorBlock) {
          context.report({ node, messageId: 'noErrorBlock', data: { tag: node.tag } });
        }
      },
    };
  },
};
