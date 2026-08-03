// @ts-nocheck
const rule = require('../src/rules/no-legacy-imports');
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

const msg = 'warp-drive.no-legacy-imports';

// Note: These tests depend on the monorepo having a mapping entry for the given module/export.
// We select cases present in public-exports-mapping-5.5.enriched.json.

eslintTester.run('no-legacy-imports', rule, {
  valid: [
    // Unknown module, should not report
    {
      code: `import { something } from 'not-in-mapping';`,
    },
    // Namespace import skipped in v1
    {
      code: `import * as REST from '@ember-data/rest/request';`,
    },
    // Export-all skipped in v1
    {
      code: `export * from '@ember-data/rest/request';`,
    },
    // Named re-exports should be ignored (no report)
    {
      code: `export { findRecord } from '@ember-data/rest/request';`,
    },
  ],
  invalid: [
    // Named import rewrite to same target
    {
      code: `import { findRecord } from '@ember-data/rest/request';`,
      output: `import { findRecord } from '@warp-drive/utilities/rest';`,
      errors: [{ messageId: msg }],
    },
    // Default import rewrite
    {
      code: `import Model from '@ember-data/model';`,
      output: `import Model from '@warp-drive/legacy/model';`,
      errors: [{ messageId: msg }],
    },
    // Mixed specifiers split: some known, some unknown (stay at original)
    {
      code: `import Model, { hasMany, Unknown } from '@ember-data/model';`,
      output: `import Model, { hasMany } from '@warp-drive/legacy/model';\nimport { Unknown } from '@ember-data/model';`,
      errors: [{ messageId: msg }],
    },
    // Default import whose replacement is a named export must be rewritten to a
    // named import, not just have its module string swapped (regression for #10525)
    {
      code: `import JSONAPIAdapter from '@ember-data/adapter/json-api';`,
      output: `import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';`,
      errors: [{ messageId: msg }],
    },
    {
      code: `import JSONAPISerializer from '@ember-data/serializer/json-api';`,
      output: `import { JSONAPISerializer } from '@warp-drive/legacy/serializer/json-api';`,
      errors: [{ messageId: msg }],
    },
    // Default import renamed locally must keep its local alias when converted to named
    {
      code: `import Adapter from '@ember-data/adapter/rest';`,
      output: `import { RESTAdapter as Adapter } from '@warp-drive/legacy/adapter/rest';`,
      errors: [{ messageId: msg }],
    },
  ],
});
