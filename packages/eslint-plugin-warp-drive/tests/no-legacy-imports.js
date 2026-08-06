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
const unmappedMsg = 'warp-drive.no-legacy-imports.unmapped-export';

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
    // A token with no per-export mapping entry ("Unknown") is still routed to
    // '@warp-drive/legacy/model' via the module-level fallback (regression for #10394),
    // since every other known export of '@ember-data/model' funnels there too.
    {
      code: `import Model, { hasMany, Unknown } from '@ember-data/model';`,
      output: `import Model, { hasMany, Unknown } from '@warp-drive/legacy/model';`,
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
    // Default import whose replacement is a named export (regression for #10399)
    {
      code: `import Store from '@ember-data/store';`,
      output: `import { Store } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // Type-only exports (interfaces/type aliases) are now tracked too, not just value
    // exports (regression for #10394 — "we added exports, mostly types").
    {
      code: `import { CachePolicy } from '@ember-data/store';`,
      output: `import { CachePolicy } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // A token never individually recorded in the mapping is routed via the module-level
    // fallback, since every known export of '@ember-data/store' funnels into
    // '@warp-drive/core' (regression for #10394).
    {
      code: `import { TotallyMadeUpExportName } from '@ember-data/store';`,
      output: `import { TotallyMadeUpExportName } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // '@ember-data/request' legitimately splits across two replacement modules
    // (RequestManager -> '@warp-drive/core', others -> '@warp-drive/ember'), so an
    // unrecognized token from it has no safe fallback and is flagged instead of guessed
    // (regression for #10394 — "we don't error ... we should").
    {
      code: `import { TotallyMadeUpExportName } from '@ember-data/request';`,
      errors: [{ messageId: unmappedMsg }],
    },
  ],
});

// `import type` is TypeScript-only syntax; @babel/eslint-parser above doesn't parse it,
// so these cases need @typescript-eslint/parser (regression for #10399).
const tsTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

tsTester.run('no-legacy-imports (type-only imports)', rule, {
  valid: [],
  invalid: [
    // A type-only default import converted to a named export must stay type-only,
    // and must become a named import rather than keeping the default form.
    {
      code: `import type Store from '@ember-data/store';`,
      output: `import type { Store } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // A lone inline `type` specifier is hoisted to a declaration-level `import type`.
    {
      code: `import { type CacheHandler } from '@ember-data/store';`,
      output: `import type { CacheHandler } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // When only some named specifiers are type-only, the inline `type` modifier
    // is preserved per-specifier rather than hoisted to the declaration.
    {
      code: `import { type CacheHandler, recordIdentifierFor } from '@ember-data/store';`,
      output: `import { type CacheHandler, recordIdentifierFor } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // A type-only-declared export (an interface, tracked with typeOnly: true in the
    // mapping data) is now rewritten too, combined with `import type` preservation
    // (regression for #10394).
    {
      code: `import type { CachePolicy } from '@ember-data/store';`,
      output: `import type { CachePolicy } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
  ],
});
