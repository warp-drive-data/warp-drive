// @ts-nocheck
const rule = require('../src/rules/require-request-error-block');
const RuleTester = require('eslint').RuleTester;

// This rule operates on the plain ESTree JSX AST rather than the Glimmer template AST used
// by the `template-*` rules, so no custom parser is needed -- ESLint's default parser
// (espree) parses JSX fine given `parserOptions.ecmaFeatures.jsx = true`.
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

const noStatesAttribute = 'noStatesAttribute';
const noErrorState = 'noErrorState';

ruleTester.run('require-request-error-block', rule, {
  valid: [
    {
      name: 'all state keys present',
      code: `
        <Request
          query={query}
          states={{ idle, loading, error, content }}
        />
      `,
    },
    {
      name: 'minimal states with error and content',
      code: `
        <Request
          query={query}
          states={{ error, content }}
        />
      `,
    },
    {
      name: 'spread present but error is also explicit',
      code: `
        <Request
          query={query}
          states={{ ...shared, error, content }}
        />
      `,
    },
    {
      name: 'spread present, error not statically visible: must not report',
      code: `
        <Request
          query={query}
          states={{ ...shared, content }}
        />
      `,
    },
    {
      name: 'states value is not an object literal: must not report',
      code: `
        <Request
          query={query}
          states={sharedStatesVariable}
        />
      `,
    },
    {
      name: 'a differently named JSX element with no states is not linted',
      code: `<MyRequest query={query} />`,
    },
    {
      name: 'a differently named JSX element containing "Request" is not linted',
      code: `<RequestThing query={query} />`,
    },
  ],

  invalid: [
    {
      name: 'no states attribute at all',
      code: `<Request query={query} />`,
      errors: [{ messageId: noStatesAttribute }],
    },
    {
      name: 'object literal present but error key genuinely missing, no spread',
      code: `
        <Request
          query={query}
          states={{ content }}
        />
      `,
      errors: [{ messageId: noErrorState }],
    },
  ],
});
