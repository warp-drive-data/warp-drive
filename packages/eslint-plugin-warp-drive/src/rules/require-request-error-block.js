/**
 * {@include ./require-request-error-block.md}
 * @module
 */
'use strict';

const REQUEST_TAG = 'Request';

const messages = {
  noStatesAttribute:
    '<Request> requires a `states` prop with an `error` handler. If this is not provided, and ' +
    "the request's error is thrown and can crash the app. Add a `states` prop with a `states.error` " +
    'handler to <Request>.',
  noErrorState:
    '<Request> requires a `states.error` handler. Without one, if the request rejects, the error ' +
    'is thrown and can crash the app. Add an `error` key to the `states` object passed to <Request>.',
};

/**
 * Returns the key name of an ObjectExpression `Property`, whether declared as an
 * identifier (`{ error }` / `{ error: ... }`) or a string literal (`{ 'error': ... }`).
 *
 * @param {object} property
 * @returns {string | undefined}
 */
function getPropertyKeyName(property) {
  if (property.type !== 'Property') return undefined;
  if (property.computed) return undefined;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal' && typeof property.key.value === 'string') return property.key.value;
  return undefined;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures <Request> is always given a states.error handler',
      category: 'Possible Errors',
      recommended: false,
      url: 'https://github.com/warp-drive-data/warp-drive/tree/main/packages/eslint-plugin-warp-drive/docs/require-request-error-block.md',
    },
    schema: [],
    messages,
  },

  create(context) {
    // This rule operates on the plain ESTree JSX AST (`JSXElement`/`JSXOpeningElement`/
    // `JSXAttribute`/`JSXExpressionContainer`/`ObjectExpression`/`Property`/`SpreadElement`)
    // rather than the Glimmer template AST used by the sibling `template-*` rules -- React's
    // `<Request>` doesn't use named template blocks, so the `error` handler is a plain
    // property on the `states` prop's object literal instead.
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== REQUEST_TAG) return;

        const statesAttribute = node.attributes.find(
          (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'states'
        );

        if (!statesAttribute) {
          context.report({ node, messageId: 'noStatesAttribute' });
          return;
        }

        const value = statesAttribute.value;
        if (!value || value.type !== 'JSXExpressionContainer') return;

        const expression = value.expression;
        if (!expression || expression.type !== 'ObjectExpression') return;

        const hasSpread = expression.properties.some((property) => property.type === 'SpreadElement');
        const errorProperty = expression.properties.find(
          (property) => getPropertyKeyName(property) === 'error'
        );

        if (errorProperty) {
          // A property explicitly named `error` was found; only flag it if it's a bare
          // `undefined` identifier, since that's statically known to supply no handler.
          if (errorProperty.value.type === 'Identifier' && errorProperty.value.name === 'undefined') {
            context.report({ node: statesAttribute, messageId: 'noErrorState' });
          }
          return;
        }

        // No `error` key found directly. If a spread is present, its source object may
        // supply `error` and that can't be resolved statically -- don't guess, don't report.
        if (hasSpread) return;

        context.report({ node: statesAttribute, messageId: 'noErrorState' });
      },
    };
  },
};
