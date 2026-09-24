/**
 * {@include ./template-always-use-request-content.md}
 * @module
 */
'use strict';

const REQUEST_TAG = 'Request';
const CONTENT_BLOCK_TAG = ':content';

const messages = {
  noBlocks:
    'Using <Request> without a :content block (or any other named block such as :idle, :loading, ' +
    ':error, :cancelled, or :always) discards the request entirely. Add a :content block to use ' +
    'the request result, or another named block if you only need to react to loading/error/etc states.',
  noBlockParam:
    'The :content block of <Request> must capture the yielded request result (e.g. ' +
    '`<:content as |result|>`) rather than discarding it. If you truly do not need the result, ' +
    'remove the :content block.',
  unusedResult:
    'The value yielded by the :content block of <Request> ("{{paramName}}") is captured but ' +
    'never used. This often means the result is being consumed indirectly (e.g. by re-reading ' +
    'it from the store elsewhere), which defeats the purpose of <Request>. Use "{{paramName}}", ' +
    'or remove the :content block if the result is genuinely not needed.',
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures the result of a <Request> is actually consumed',
      category: 'Possible Errors',
      recommended: false,
      url: 'https://github.com/warp-drive-data/warp-drive/tree/main/packages/eslint-plugin-warp-drive/docs/template-always-use-request-content.md',
    },
    schema: [],
    messages,
  },

  create(context) {
    // This rule visits the Glimmer template AST that `ember-eslint-parser` exposes to
    // ESLint for `.gjs`/`.gts` files (and `.hbs` via `ember-eslint-parser/hbs`), using
    // `Glimmer`-prefixed node types that otherwise match `@glimmer/syntax`'s AST shape
    // 1:1 (e.g. `GlimmerElementNode.tag`/`.blockParams`, `GlimmerPathExpression.head`).
    //
    // Because ESLint performs a single top-down traversal of the whole file (JS/TS and
    // template nodes interleaved), the "is the :content block's result actually used"
    // check is implemented as streaming state over that traversal rather than as an
    // isolated sub-traversal: a stack of currently-open "content frames" (one per
    // tracked `:content` block, supporting nested `<Request>` usage) is checked against
    // a shared shadow stack that record which block-param names are currently in scope,
    // so that e.g. `{{#each result.items as |result|}}` correctly counts `result.items`
    // as a use of the outer `result` while not counting `result.name` inside the loop
    // body, which refers to the shadowing inner `result`.
    //
    // Note: this shadow-tracking is scoped to `GlimmerBlock` (a block's body) rather
    // than `GlimmerBlockStatement` (the whole `{{#each ...}}...{{/each}}` construct,
    // including its path/params/hash, which are evaluated in the *outer* scope, before
    // the new block param comes into scope) -- tracking on `GlimmerBlockStatement`
    // instead would incorrectly treat `result` in `{{#each result.items as |result|}}`
    // as already shadowed.

    /** @type {Map<object, string>} tracked `:content` GlimmerElementNode -> its result param name */
    const trackedContentBlocks = new Map();
    /** @type {{node: object, resultName: string, used: boolean, pushDepth: number}[]} */
    const activeFrames = [];
    /** @type {(string[] | null)[]} */
    const shadowStack = [];

    function isShadowedForFrame(frame, name) {
      for (let i = frame.pushDepth; i < shadowStack.length; i++) {
        const entry = shadowStack[i];
        if (entry && entry.includes(name)) return true;
      }
      return false;
    }

    function markUsageIfMatches(name) {
      for (const frame of activeFrames) {
        if (frame.used) continue;
        if (frame.resultName !== name) continue;
        if (!isShadowedForFrame(frame, name)) {
          frame.used = true;
        }
      }
    }

    return {
      GlimmerElementNode(node) {
        // 1. <Request>-specific checks. These don't need deferral: whether a :content
        // block exists, and whether it captured a result param, is knowable immediately.
        if (node.tag === REQUEST_TAG) {
          const namedBlocks = node.children.filter(
            (child) => child.type === 'GlimmerElementNode' && child.tag.startsWith(':')
          );
          const contentBlock = namedBlocks.find((block) => block.tag === CONTENT_BLOCK_TAG);

          if (!contentBlock) {
            const hasOtherNamedBlock = namedBlocks.some((block) => block.tag !== CONTENT_BLOCK_TAG);
            if (!hasOtherNamedBlock) {
              context.report({ node, messageId: 'noBlocks' });
            }
          } else {
            const [resultParamName] = contentBlock.blockParams;
            if (!resultParamName) {
              context.report({ node: contentBlock, messageId: 'noBlockParam' });
            } else {
              trackedContentBlocks.set(contentBlock, resultParamName);
            }
          }
        }

        // 2. A component may be invoked via a yielded reference (e.g. `<result.Foo />`);
        // check this *before* pushing the element's own block params below, since a
        // node's own tag (like its attributes) is evaluated in the outer scope relative
        // to any block params it declares via `as |...|`.
        markUsageIfMatches(node.tag.split('.')[0]);

        // 3. Push this element's own block params (if any), establishing a new scope
        // for its children only.
        shadowStack.push(node.blockParams && node.blockParams.length ? node.blockParams : null);

        // 4. If this is a tracked `:content` block, start tracking usage within it.
        if (trackedContentBlocks.has(node)) {
          activeFrames.push({
            node,
            resultName: trackedContentBlocks.get(node),
            used: false,
            pushDepth: shadowStack.length,
          });
        }
      },

      'GlimmerElementNode:exit'(node) {
        shadowStack.pop();
        const top = activeFrames[activeFrames.length - 1];
        if (top && top.node === node) {
          activeFrames.pop();
          if (!top.used) {
            context.report({ node: top.node, messageId: 'unusedResult', data: { paramName: top.resultName } });
          }
        }
      },

      GlimmerBlock(node) {
        shadowStack.push(node.blockParams && node.blockParams.length ? node.blockParams : null);
      },
      'GlimmerBlock:exit'() {
        shadowStack.pop();
      },

      GlimmerPathExpression(node) {
        if (node.head.type !== 'VarHead') return;
        markUsageIfMatches(node.head.name);
      },
    };
  },
};
