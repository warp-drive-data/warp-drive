import type { AST } from '@glimmer/syntax';
import { traverse } from '@glimmer/syntax';

import { Rule } from 'ember-template-lint';

const REQUEST_TAG = 'Request';
const CONTENT_BLOCK_TAG = ':content';

const NO_BLOCKS_MESSAGE =
  'Using <Request> without a :content block (or any other named block such as :idle, :loading, ' +
  ':error, :cancelled, or :always) discards the request entirely. Add a :content block to use ' +
  'the request result, or another named block if you only need to react to loading/error/etc states.';

const NO_BLOCK_PARAM_MESSAGE =
  'The :content block of <Request> must capture the yielded request result (e.g. ' +
  '`<:content as |result|>`) rather than discarding it. If you truly do not need the result, ' +
  'remove the :content block.';

function unusedResultMessage(paramName: string): string {
  return (
    `The value yielded by the :content block of <Request> ("${paramName}") is captured but ` +
    `never used. This often means the result is being consumed indirectly (e.g. by re-reading ` +
    `it from the store elsewhere), which defeats the purpose of <Request>. Use "${paramName}", ` +
    `or remove the :content block if the result is genuinely not needed.`
  );
}

function isElementNode(node: AST.Node): node is AST.ElementNode {
  return node.type === 'ElementNode';
}

function isNamedBlock(node: AST.ElementNode): boolean {
  return node.tag.startsWith(':');
}

/**
 * Determines whether `identifierName` -- the first block param bound by a
 * `:content` block -- is referenced anywhere within `subtree`.
 *
 * This walks the subtree honoring shadowing: if a nested construct (another
 * named block, a `{{#each}}`/`{{#let}}`, or even a nested `<Request>` whose
 * own `:content` block happens to reuse the same param name) redeclares a
 * block param with the same name, references inside that nested scope refer
 * to the inner declaration and are not counted as usage of the outer one.
 */
function isIdentifierReferenced(subtree: AST.ElementNode, identifierName: string): boolean {
  let referenced = false;
  let shadowDepth = 0;

  function introducesShadow(blockParams: readonly string[] | undefined): boolean {
    return !!blockParams && blockParams.includes(identifierName);
  }

  traverse(subtree, {
    ElementNode: {
      enter(node) {
        if (node === subtree) return;
        if (introducesShadow(node.blockParams)) shadowDepth++;
        if (shadowDepth === 0 && node.tag.split('.')[0] === identifierName) {
          referenced = true;
        }
      },
      exit(node) {
        if (node === subtree) return;
        if (introducesShadow(node.blockParams)) shadowDepth--;
      },
    },
    // `Block` is the AST node for a block's *body* (e.g. the contents of
    // `{{#each ... as |x|}}...{{/each}}`), as distinct from `BlockStatement`
    // (the whole construct, including its path/params/hash which are
    // evaluated in the *outer* scope, before the new block param comes into
    // scope). Tracking shadowing on `Block` instead of `BlockStatement`
    // ensures that e.g. `result` in `{{#each result.items as |result|}}` is
    // correctly counted as a reference to the outer `result`.
    Block: {
      enter(node) {
        if (introducesShadow(node.blockParams)) shadowDepth++;
      },
      exit(node) {
        if (introducesShadow(node.blockParams)) shadowDepth--;
      },
    },
    PathExpression(node) {
      if (shadowDepth === 0 && node.head.type === 'VarHead' && node.head.name === identifierName) {
        referenced = true;
      }
    },
  });

  return referenced;
}

/**
 * Lints against using the `<Request>` component's `:content` block without
 * actually consuming the yielded request result, and against using
 * `<Request>` in a way that discards the request's outcome altogether.
 *
 * Discarding the result this way is usually a sign of an anti-pattern in
 * which the result is being consumed indirectly by re-reading the resource
 * from the store elsewhere, defeating the purpose of using `<Request>` to
 * establish a resolution boundary in the first place.
 *
 * This rule flags three situations for any `<Request>` element:
 *
 * - No `:content` block, and no other named block (`:idle`, `:loading`,
 *   `:error`, `:cancelled`, `:always`, etc.) either -- the request's
 *   outcome is entirely discarded.
 * - A `:content` block that does not capture the yielded result via a
 *   block param (e.g. `<:content>...</:content>`).
 * - A `:content` block that captures the yielded result but never
 *   references it anywhere in the block's body. The block's second
 *   yielded "state" param, if captured, is unrelated to this check and its
 *   usage (or lack thereof) never affects the result.
 *
 * @public
 */
export default class AlwaysUseRequestContent extends Rule {
  override visitor() {
    return {
      ElementNode: (node: AST.ElementNode) => {
        if (node.tag !== REQUEST_TAG) return;

        const namedBlocks = node.children.filter(isElementNode).filter(isNamedBlock);
        const contentBlock = namedBlocks.find((block) => block.tag === CONTENT_BLOCK_TAG);

        if (!contentBlock) {
          const hasOtherNamedBlock = namedBlocks.some((block) => block.tag !== CONTENT_BLOCK_TAG);
          if (!hasOtherNamedBlock) {
            this.log({ message: NO_BLOCKS_MESSAGE, node });
          }
          return;
        }

        const [resultParamName] = contentBlock.blockParams;

        if (!resultParamName) {
          this.log({ message: NO_BLOCK_PARAM_MESSAGE, node: contentBlock });
          return;
        }

        if (!isIdentifierReferenced(contentBlock, resultParamName)) {
          this.log({ message: unusedResultMessage(resultParamName), node: contentBlock });
        }
      },
    };
  }
}
