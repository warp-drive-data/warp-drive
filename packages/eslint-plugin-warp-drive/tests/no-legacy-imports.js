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
const legacyHomeMsg = 'warp-drive.no-legacy-imports.legacy-home';
const typeOnlyTargetMsg = 'warp-drive.no-legacy-imports.type-only-target';

eslintTester.run('no-legacy-imports', rule, {
  valid: [
    // Unknown module, should not report
    {
      code: `import { something } from 'not-in-mapping';`,
    },
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
    // A module whose name survived the move is not a legacy import
    {
      code: `import { DEBUG } from '@warp-drive/build-config/env';`,
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
    {
      name: 'a name the explicit-list shim never had is reported, the known names are rewritten',
      code: `import Model, { hasMany, Unknown } from '@ember-data/model';`,
      output: `import Model, { hasMany } from '@warp-drive/legacy/model';\nimport { Unknown } from '@ember-data/model';`,
      errors: [{ messageId: msg }, { messageId: unmappedMsg }],
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
    {
      name: 'a module without export * forwards no unrecorded name (regression for #10394)',
      code: `import { TotallyMadeUpExportName } from '@ember-data/store';`,
      errors: [{ messageId: unmappedMsg }],
    },
    {
      name: 'an unrecorded name rides the single export * of its module',
      code: `import { TotallyMadeUpExportName } from '@ember-data/request';`,
      output: `import { TotallyMadeUpExportName } from '@warp-drive/core/request';`,
      errors: [{ messageId: msg }],
    },
    // The default export of '@ember-data/request' is the RequestManager class
    {
      code: `import RequestManager from '@ember-data/request';`,
      output: `import { RequestManager } from '@warp-drive/core';`,
      errors: [{ messageId: msg }],
    },
    // The value export CachePolicy was renamed; it must not be confused with the type of the same name
    {
      code: `import { CachePolicy } from '@ember-data/request-utils';`,
      output: `import { DefaultCachePolicy as CachePolicy } from '@warp-drive/core/store';`,
      errors: [{ messageId: msg }],
    },
    // A token the legacy package no longer exposes is reported, not routed through the module fallback
    {
      code: `import { defineSignal } from '@ember-data/store/-private';`,
      output: null,
      errors: [{ messageId: unmappedMsg }],
    },
    // A token the legacy package defines itself has nowhere to be rewritten to
    {
      name: 'a token the legacy package declares itself is reported as a legacy home',
      code: `import Store from 'ember-data/store';`,
      output: null,
      errors: [{ messageId: legacyHomeMsg }],
    },
    {
      name: 'a token that still lives in a legacy package is reported without a fix',
      code: `import VERSION from 'ember-data/version';`,
      output: null,
      errors: [{ messageId: legacyHomeMsg }],
    },
    {
      name: 'a namespace import follows the module move',
      code: `import * as compat from '@ember-data/legacy-compat';`,
      output: `import * as compat from '@warp-drive/legacy/compat';`,
      errors: [{ messageId: msg }],
    },
    {
      name: 'from selects the map; the 5.7-5.8 override picks @warp-drive/ember',
      code: `import { getRequestState } from '@warp-drive/core/store/-private';`,
      output: `import { getRequestState } from '@warp-drive/ember';`,
      options: [{ from: '5.7' }],
      errors: [{ messageId: msg }],
    },
  ],
});

describe('no-legacy-imports (options)', () => {
  it('rejects a from-version the plugin does not ship', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const config = {
      plugins: { 'warp-drive': { rules: { 'no-legacy-imports': rule } } },
      rules: { 'warp-drive/no-legacy-imports': ['error', { from: '4.12' }] },
    };
    require('assert').throws(
      () => linter.verify(`import Model from '@ember-data/model';`, config),
      /"4.12" should be equal to one of the allowed values/
    );
  });
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
  valid: [
    {
      name: 'a type import of a type that did not move stays silent',
      code: `import type { Store } from '@warp-drive/legacy/store';`,
      options: [{ from: '5.7' }],
    },
    {
      name: 'a value import of a name that was already type-only in the from release stays silent',
      code: `import { Store } from '@warp-drive/legacy/store';`,
      options: [{ from: '5.7' }],
    },
  ],
  invalid: [
    {
      name: 'a value import of a value that moved onto a type-only export is reported, not rewritten',
      code: `import { ManyArray } from '@ember-data/model/-private';`,
      output: null,
      errors: [{ messageId: typeOnlyTargetMsg }],
    },
    {
      name: 'a type import of a value that moved onto a type-only export is rewritten',
      code: `import type { ManyArray } from '@ember-data/model/-private';`,
      output: `import type { ManyArray } from '@warp-drive/legacy/model/-private';`,
      errors: [{ messageId: msg }],
    },
    {
      name: 'an inline type specifier onto a type-only export is rewritten',
      code: `import { type ManyArray } from '@ember-data/model/-private';`,
      output: `import type { ManyArray } from '@warp-drive/legacy/model/-private';`,
      errors: [{ messageId: msg }],
    },
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
    {
      name: 'a type re-exported through an export type list is rewritten to its new home',
      code: `import type { ManyArray } from '@ember-data/model';`,
      output: `import type { ManyArray } from '@warp-drive/legacy/model';`,
      errors: [{ messageId: msg }],
    },
  ],
});
