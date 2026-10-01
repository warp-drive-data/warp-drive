// @ts-nocheck
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Linter, RuleTester } = require('eslint');

const mapping = require('../src/legacy-import-mapping/index.js');
const rule = require('../src/rules/no-legacy-imports');

const FIXTURE = path.join(__dirname, 'fixtures', 'legacy-import-mapping');

const REWRITE = 'warp-drive.no-legacy-imports';
const MESSAGE_IDS = {
  rewrite: REWRITE,
  'private-target': `${REWRITE}.private-target`,
  removed: `${REWRITE}.removed`,
  untracked: `${REWRITE}.untracked`,
  'type-only-target': `${REWRITE}.type-only-target`,
  'side-effect': `${REWRITE}.side-effect`,
};

/**
 * Points the rule at `dataDir` for the tests of the enclosing `describe`. The rule calls
 * `mapping.loadMap`, so wrapping it is enough.
 */
function useDataDir(dataDir) {
  const { loadMap } = mapping;
  before(() => {
    mapping.loadMap = (options) => loadMap({ ...options, dataDir });
  });
  after(() => {
    mapping.loadMap = loadMap;
  });
}

const tsParser = { parser: require('@typescript-eslint/parser'), ecmaVersion: 'latest', sourceType: 'module' };
const babelParser = {
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
};

/*
 * The decision table: [from, to, source, output after one pass of fixes (null: no fix), reports].
 * The fixture data (tests/fixtures/legacy-import-mapping, shipped from
 * scripts/__tests__/fixtures/public-exports-mapping/map) has the releases 4.12.8, 5.0.1, 5.6.0,
 * 5.9.1 and head, and a judged decision for three declarations of 4.12.8.
 */
const TABLE = [
  // default import of a class that became a named export
  ['4.12', '5.9', `import Store from '@ember-data/store';`, `import { Store } from '@warp-drive/core';`, ['rewrite']],
  [
    '4.12',
    '5.9',
    `import { recordIdentifierFor, storeFor } from '@ember-data/store';`,
    `import { recordIdentifierFor, storeFor } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import Store, { recordIdentifierFor } from '@ember-data/store';`,
    `import { Store, recordIdentifierFor } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  // a judged decision gives the home of a declaration the diffs could not follow
  [
    '4.12',
    '5.9',
    `import { CacheHandler } from '@ember-data/store';`,
    `import { CacheHandler } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  // nothing continues it and nobody judged it: removed, without a removedIn
  ['4.12', '5.9', `import { normalizeModelName } from '@ember-data/store';`, null, ['removed']],
  // one import split between the names that stay and the names that move
  [
    '4.12',
    '5.9',
    `import { normalizeModelName, storeFor } from '@ember-data/store';`,
    `import { normalizeModelName } from '@ember-data/store';\nimport { storeFor } from '@warp-drive/core';`,
    ['rewrite', 'removed'],
  ],
  ['4.12', '5.9', `import { Unknown } from '@ember-data/store';`, null, ['untracked']],
  // a name the from release did not export follows the module's forward at `to`
  [
    '4.12',
    '5.9',
    `import { Unknown } from '@ember-data/store/-private';`,
    `import { Unknown } from '@warp-drive/core/store/-private';`,
    ['private-target'],
  ],
  // the judged choice is in a private module
  [
    '4.12',
    '5.9',
    `import { IdentifierArray } from '@ember-data/store/-private';`,
    `import { LiveArray as IdentifierArray } from '@warp-drive/core/store/-private';`,
    ['private-target'],
  ],
  [
    '4.12',
    '5.9',
    `import { coerceId, Store } from '@ember-data/store/-private';`,
    `import { coerceId } from '@warp-drive/core/store/-private';\nimport { Store } from '@warp-drive/core';`,
    ['rewrite', 'private-target'],
  ],
  [
    '4.12',
    '5.9',
    `import Model, { attr, belongsTo } from '@ember-data/model';`,
    `import Model, { attr, belongsTo } from '@warp-drive/legacy/model';`,
    ['rewrite'],
  ],
  // merged into an existing import of the target module
  [
    '4.12',
    '5.9',
    `import { hasMany } from '@ember-data/model';\nimport { Model } from '@warp-drive/legacy/model';`,
    `import { Model, hasMany } from '@warp-drive/legacy/model';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import Model from '@ember-data/model';\nimport { attr } from '@warp-drive/legacy/model';`,
    `import Model, { attr } from '@warp-drive/legacy/model';`,
    ['rewrite'],
  ],
  // a value that is only a type in `to`
  ['4.12', '5.9', `import { ManyArray } from '@ember-data/model/-private';`, null, ['type-only-target']],
  [
    '4.12',
    '5.9',
    `import type { ManyArray } from '@ember-data/model/-private';`,
    `import type { ManyArray } from '@warp-drive/legacy/model';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import { type ManyArray, PromiseManyArray } from '@ember-data/model/-private';`,
    `import { type ManyArray, AsyncHasMany as PromiseManyArray } from '@warp-drive/legacy/model';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import type Store from '@ember-data/store';`,
    `import type { Store } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import { type StoreRequestInput } from '@ember-data/store';`,
    `import type { StoreRequestInput } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import { type StoreRequestInput, storeFor } from '@ember-data/store';`,
    `import { type StoreRequestInput, storeFor } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import JSONAPIAdapter from '@ember-data/adapter/json-api';`,
    `import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import Adapter from 'ember-data/adapters/json-api';`,
    `import { JSONAPIAdapter as Adapter } from '@warp-drive/legacy/adapter/json-api';`,
    ['rewrite'],
  ],
  // removed, with the removing PR and a shim from the judged decision
  ['4.12', '5.9', `import { errorsArrayToHash } from '@ember-data/adapter/error';`, null, ['removed']],
  [
    '4.12',
    '5.9',
    `import AdapterError, { InvalidError } from '@ember-data/adapter/error';`,
    `import AdapterError, { InvalidError } from '@warp-drive/legacy/adapter/error';`,
    ['rewrite'],
  ],
  // modules preferences.json reports as a whole
  ['4.12', '5.9', `import Store from 'ember-data/store';`, null, ['side-effect']],
  ['4.12', '5.9', `import DS from 'ember-data';`, null, ['side-effect']],
  ['4.12', '5.9', `import 'ember-data';`, null, ['side-effect']],
  // namespace imports follow a forward, or a move of every export to one module
  [
    '4.12',
    '5.9',
    `import * as compat from '@ember-data/legacy-compat';`,
    `import * as compat from '@warp-drive/legacy/compat';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import * as model from '@ember-data/model';`,
    `import * as model from '@warp-drive/legacy/model';`,
    ['rewrite'],
  ],
  ['4.12', '5.9', `import * as store from '@ember-data/store';`, null, []],
  [
    '4.12',
    '5.9',
    `import * as internals from '@ember-data/store/-private';`,
    `import * as internals from '@warp-drive/core/store/-private';`,
    ['private-target'],
  ],
  // a side-effect import of a module that forwards follows the forward
  ['4.12', '5.9', `import '@ember-data/legacy-compat';`, `import '@warp-drive/legacy/compat';`, ['rewrite']],
  // an export renamed in place: the deprecated alias loses to the canonical name
  [
    '4.12',
    '5.9',
    `import { CachePolicy } from '@ember-data/request-utils';`,
    `import { DefaultCachePolicy as CachePolicy } from '@warp-drive/core/store';`,
    ['rewrite'],
  ],
  [
    '4.12',
    '5.9',
    `import RequestManager, { createDeferred } from '@ember-data/request';`,
    `import { RequestManager } from '@warp-drive/core';\nimport { createDeferred } from '@warp-drive/core/request';`,
    ['rewrite'],
  ],
  // modules the from release did not have
  ['4.12', '5.9', `import { something } from 'lodash';`, null, []],
  ['4.12', '5.9', `import { Store } from '@warp-drive/core';`, null, []],
  ['4.12', '5.9', `export { attr } from '@ember-data/model';`, null, []],
  // quotes and semicolons follow the source
  [
    '4.12',
    '5.9',
    `import { storeFor } from "@ember-data/store"`,
    `import { storeFor } from "@warp-drive/core"`,
    ['rewrite'],
  ],
  // to 5.0: old-contract homes, a named import that becomes a default import
  [
    '4.12',
    '5.0',
    `import { AdapterError, InvalidError } from 'ember-data/adapters/errors';`,
    `import AdapterError, { InvalidError } from '@ember-data/adapter/error';`,
    ['rewrite'],
  ],
  ['4.12', '5.0', `import Store from '@ember-data/store';`, null, []],
  [
    '4.12',
    '5.0',
    `import { Store } from '@ember-data/store/-private';\nimport { storeFor } from '@ember-data/store';`,
    `import Store, { storeFor } from '@ember-data/store';`,
    ['rewrite'],
  ],
  // a decision judged against 5.9.1 maps back to 5.6.0 and forward to head
  [
    '4.12',
    '5.6',
    `import { CacheHandler } from '@ember-data/store';`,
    `import { CacheHandler } from '@warp-drive/core';`,
    ['rewrite'],
  ],
  [
    '4.12',
    'head',
    `import { IdentifierArray } from '@ember-data/store/-private';`,
    `import { ReactiveResourceArray as IdentifierArray } from '@warp-drive/core/store/-private';`,
    ['private-target'],
  ],
  // a backport 5.0.1 lacks and 5.6.0 declares again under the same id: removed in 5.0, kept in
  // 5.6, and moved with the declaration in 5.9
  ['4.12', '5.0', `import { setBuildURLConfig } from '@ember-data/request-utils';`, null, ['removed']],
  ['4.12', '5.6', `import { setBuildURLConfig } from '@ember-data/request-utils';`, null, []],
  [
    '4.12',
    '5.9',
    `import { setBuildURLConfig } from '@ember-data/request-utils';`,
    `import { setBuildURLConfig } from '@warp-drive/utilities';`,
    ['rewrite'],
  ],
  // between two modern homes of the same declaration, preferences.tieBreak picks @warp-drive/ember
  [
    '5.6',
    '5.9',
    `import { getRequestState } from '@warp-drive/core/store/-private';`,
    `import { getRequestState } from '@warp-drive/ember';`,
    ['rewrite'],
  ],
  ['5.6', '5.9', `import { LiveArray } from '@warp-drive/core/store/-private';`, null, []],
  [
    '5.9',
    '5.9',
    `import { CachePolicy } from '@warp-drive/core/store';`,
    `import { DefaultCachePolicy as CachePolicy } from '@warp-drive/core/store';`,
    ['rewrite'],
  ],
  ['5.9', '5.9', `import { DefaultCachePolicy } from '@warp-drive/core/store';`, null, []],
  // rule 0: a home ranks before a shim that only re-exports it, though the shim has fewer segments
  [
    '4.12',
    '5.9',
    `import type { RequestInfo } from '@ember-data/request';`,
    `import type { RequestInfo } from '@warp-drive/core/types/request';`,
    ['rewrite'],
  ],
  [
    '5.6',
    '5.9',
    `import type { RequestInfo } from '@warp-drive/core-types/request';`,
    `import type { RequestInfo } from '@warp-drive/core/types/request';`,
    ['rewrite'],
  ],
  // a name the from release did not export follows a shim, but not a home's relative export *
  [
    '5.6',
    '5.9',
    `import { Unknown } from '@warp-drive/core-types/request';`,
    `import { Unknown } from '@warp-drive/core/types/request';`,
    ['rewrite'],
  ],
  ['5.6', '5.9', `import { Unknown } from '@warp-drive/core/types/request';`, null, ['untracked']],
  // the source token stays when only the tie break or the alphabet would move it
  ['5.9', '5.9', `import { getRequestState } from '@warp-drive/react';`, null, []],
  // a value that became a type in place: type-only is checked before keep
  ['5.6', '5.9', `import { ConfiguredStore } from '@warp-drive/core';`, null, ['type-only-target']],
  ['5.6', '5.9', `import type { ConfiguredStore } from '@warp-drive/core';`, null, []],
  // preferences.tieBreak names a package: any module of it wins the tie
  [
    '5.6',
    '5.9',
    `import { getPromiseState } from '@warp-drive/core/store/-private';`,
    `import { getPromiseState } from '@warp-drive/ember/reactive';`,
    ['rewrite'],
  ],
  // preferences.ignorePackages: imports from those packages are never touched
  ['5.6', '5.9', `import { UmbrellaOnly, Store } from 'warp-drive/core';`, null, []],
  // 5.3 is not a listed release: it means 5.0.1, which no longer had normalizeModelName
  ['5.3', '5.9', `import { normalizeModelName } from '@ember-data/store';`, null, ['untracked']],
];

/**
 * @param {Array} row
 */
function testCase([from, to, code, output, reports]) {
  const test = { name: `${from} -> ${to}: ${code.replace(/\n/g, ' / ')}`, code, options: [{ from, to }] };
  if (!reports.length) return { valid: true, test };
  return {
    valid: false,
    test: { ...test, output, errors: reports.map((report) => ({ messageId: MESSAGE_IDS[report] })) },
  };
}

const cases = TABLE.map(testCase);

describe('no-legacy-imports', () => {
  useDataDir(FIXTURE);

  new RuleTester({ languageOptions: tsParser }).run('decision table', rule, {
    valid: cases.filter((c) => c.valid).map((c) => c.test),
    invalid: cases.filter((c) => !c.valid).map((c) => c.test),
  });

  // The rule only reads the ESTree import nodes; a JavaScript parser that leaves `importKind`
  // unset works the same.
  new RuleTester({ languageOptions: babelParser }).run('JavaScript parser', rule, {
    valid: [{ code: `import { something } from 'lodash';`, options: [{ from: '4.12', to: '5.9' }] }],
    invalid: [
      {
        code: `import Adapter from 'ember-data/adapters/json-api';\nimport Model, { attr } from '@ember-data/model';`,
        output: `import { JSONAPIAdapter as Adapter } from '@warp-drive/legacy/adapter/json-api';\nimport Model, { attr } from '@warp-drive/legacy/model';`,
        options: [{ from: '4.12', to: '5.9' }],
        errors: [{ messageId: REWRITE }, { messageId: REWRITE }],
      },
    ],
  });

  describe('fixes across declarations', () => {
    const config = (options) => ({
      languageOptions: tsParser,
      plugins: { 'warp-drive': { rules: { 'no-legacy-imports': rule } } },
      rules: { 'warp-drive/no-legacy-imports': ['error', options] },
    });
    const fixAll = (code, options = { from: '4.12', to: '5.9' }) => new Linter().verifyAndFix(code, config(options));

    it('merges two declarations that move to one new module, over two passes', () => {
      const code = `import Store from '@ember-data/store';\nimport { recordIdentifierFor } from '@ember-data/store/-private';\n`;
      const result = fixAll(code);
      assert.deepStrictEqual(result.messages, []);
      assert.strictEqual(result.output, `import { Store, recordIdentifierFor } from '@warp-drive/core';\n`);
    });

    it('merges two declarations into the same existing import', () => {
      const code = [
        `import { Store } from '@warp-drive/core';`,
        `import { storeFor } from '@ember-data/store';`,
        `import { recordIdentifierFor } from '@ember-data/store/-private';`,
        '',
      ].join('\n');
      const result = fixAll(code);
      assert.deepStrictEqual(result.messages, []);
      assert.strictEqual(result.output, `import { Store, storeFor, recordIdentifierFor } from '@warp-drive/core';\n`);
    });

    it('adds to a multi-line import one specifier per line', () => {
      const code = `import {\n  Store,\n} from '@warp-drive/core';\nimport { storeFor } from '@ember-data/store';\n`;
      assert.strictEqual(fixAll(code).output, `import {\n  Store,\n  storeFor,\n} from '@warp-drive/core';\n`);
    });

    it('adds type-only names to a value import with an inline type', () => {
      const code = `import { storeFor } from '@warp-drive/core';\nimport type { StoreRequestInput } from '@ember-data/store';\n`;
      assert.strictEqual(fixAll(code).output, `import { storeFor, type StoreRequestInput } from '@warp-drive/core';\n`);
    });

    it('does not add value names to an import type declaration', () => {
      const code = `import type { StoreRequestInput } from '@warp-drive/core';\nimport { storeFor } from '@ember-data/store';\n`;
      assert.strictEqual(
        fixAll(code).output,
        `import type { StoreRequestInput } from '@warp-drive/core';\nimport { storeFor } from '@warp-drive/core';\n`
      );
    });

    it('leaves a declaration the user disabled the rule for alone', () => {
      const code = [
        '// eslint-disable-next-line warp-drive/no-legacy-imports',
        `import Store from '@ember-data/store';`,
        `import { recordIdentifierFor } from '@ember-data/store/-private';`,
        '',
      ].join('\n');
      const result = fixAll(code);
      assert.deepStrictEqual(result.messages, []);
      assert.strictEqual(
        result.output,
        [
          '// eslint-disable-next-line warp-drive/no-legacy-imports',
          `import Store from '@ember-data/store';`,
          `import { recordIdentifierFor } from '@warp-drive/core';`,
          '',
        ].join('\n')
      );
    });
  });

  describe('messages', () => {
    const messagesFor = (code, options = { from: '4.12', to: '5.9' }) =>
      new Linter().verify(code, {
        languageOptions: tsParser,
        plugins: { 'warp-drive': { rules: { 'no-legacy-imports': rule } } },
        rules: { 'warp-drive/no-legacy-imports': ['error', options] },
      });

    it('names every moved import', () => {
      const [message] = messagesFor(`import Store, { storeFor } from '@ember-data/store';`);
      assert.strictEqual(
        message.message,
        'Imports from "@ember-data/store" moved in 5.9.1: default to Store in "@warp-drive/core", storeFor to "@warp-drive/core".'
      );
    });

    it('prints the removing PR, the shim and the links of a judged removal', () => {
      const [message] = messagesFor(`import { errorsArrayToHash } from '@ember-data/adapter/error';`);
      assert.match(
        message.message,
        /^"errorsArrayToHash" from "@ember-data\/adapter\/error" has no replacement in 5\.9\.1 \(removed in #8550\)\./
      );
      assert.match(message.message, /A shim that restores it:\nexport function errorsArrayToHash\(errors\) \{\n/);
      assert.match(
        message.message,
        /See: In-place upgrade guide \(https:\/\/warp-drive\.io\/upgrading\/v5\/\), API docs \(https:\/\/warp-drive\.io\/api\/\), Request service cheat sheet \(https:\/\/request-service-cheat-sheet\.netlify\.app\)\.$/
      );
    });

    it('points a side-effect import at the upgrade guide', () => {
      const [message] = messagesFor(`import Store from 'ember-data/store';`);
      assert.strictEqual(message.line, 1);
      assert.match(message.message, /^Importing "ember-data\/store" also sets things up as a side effect/);
      assert.match(message.message, /See: In-place upgrade guide \(https:\/\/warp-drive\.io\/upgrading\/v5\/\)\.$/);
    });

    it('names the type a value moved onto', () => {
      const [message] = messagesFor(`import { ManyArray } from '@ember-data/model/-private';`);
      assert.match(message.message, /only has a type for it: ManyArray in "@warp-drive\/legacy\/model"\./);
      assert.match(message.message, /Use `import type` if it is only used as a type, and the rule then rewrites it;/);
    });

    it('promises no rewrite for a value that became a type in place', () => {
      const [message] = messagesFor(`import { ConfiguredStore } from '@warp-drive/core';`, { from: '5.6', to: '5.9' });
      assert.match(message.message, /only has a type for it: ConfiguredStore in "@warp-drive\/core"\./);
      assert.match(
        message.message,
        /Use `import type` if it is only used as a type; otherwise it needs manual migration\.$/
      );
    });

    it('names the release an untracked name was looked up in', () => {
      const [message] = messagesFor(`import { Unknown } from '@ember-data/store';`);
      assert.match(message.message, /^"@ember-data\/store" did not export "Unknown" in 4\.12\.8/);
    });

    it('names head by the plugin version', () => {
      const [message] = messagesFor(`import Store from '@ember-data/store';`, { from: '4.12', to: 'head' });
      assert.match(message.message, new RegExp(`moved in ${mapping.HEAD_VERSION.replace(/\./g, '\\.')}:`));
    });
  });

  describe('options', () => {
    const lint = (options) =>
      new Linter().verify(`import Store from '@ember-data/store';`, {
        plugins: { 'warp-drive': { rules: { 'no-legacy-imports': rule } } },
        rules: { 'warp-drive/no-legacy-imports': ['error', options] },
      });

    it('rejects options other than from and to', () => {
      assert.throws(() => lint({ from: '4.12', until: '5.9' }), /should NOT have additional properties/);
    });

    it('rejects a from that is not a string', () => {
      assert.throws(() => lint({ from: 4.12 }), /should be string/);
    });

    it('names the versions the data covers when from is not one of them', () => {
      assert.throws(() => lint({ from: '4.6' }), /no-legacy-imports: no data for 4\.6; known: 4\.12, 5\.0, 5\.6, 5\.9/);
    });

    it('rejects a from newer than to', () => {
      assert.throws(() => lint({ from: '5.9', to: '5.6' }), /from 5\.9\.1 is newer than to 5\.6\.0/);
    });
  });
});

describe('no-legacy-imports without mapping data', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'no-legacy-imports-'));
  after(() => fs.rmSync(empty, { recursive: true, force: true }));
  useDataDir(empty);

  new RuleTester({ languageOptions: tsParser }).run('stays silent', rule, {
    valid: [`import Store from '@ember-data/store';`, `import 'ember-data';`],
    invalid: [],
  });
});
