import lintQUnit from 'eslint-plugin-qunit';

import * as isolation from './isolation.js';
import { splitByExtension } from './split-files.js';

const QUNIT_IMPORTS = ['@ember/test-helpers', '@ember/test-waiters', 'ember-qunit', 'qunit'];

export function rules(config = {}) {
  const ourRules = {
    'qunit/no-assert-logical-expression': 'off',
    'qunit/no-conditional-assertions': 'off',
    'qunit/no-early-return': 'off',
    'qunit/no-ok-equality': 'off',
    'qunit/require-expect': 'off',
  };

  config.allowedImports = Array.isArray(config.allowedImports)
    ? config.allowedImports.concat(QUNIT_IMPORTS)
    : QUNIT_IMPORTS.slice();

  return Object.assign({}, lintQUnit.configs.recommended.rules, isolation.rules(config), ourRules);
}

export function plugins() {
  return { qunit: lintQUnit };
}

/**
 * oxlint's `qunit` jsPlugin (see `.oxlintrc.json`'s `jsPlugins`) and its `no-restricted-imports`/
 * `no-restricted-globals` overrides already cover these rules for plain `.ts`/`.js` test files.
 * `.gts`/`.gjs` aren't scanned by oxlint's parser, so ESLint keeps enforcing the full rule set
 * there — see the split in `ember()` below.
 *
 * @return {import('eslint').Linter.RulesRecord}
 */
export function disabledRules() {
  return Object.fromEntries(
    Object.keys(lintQUnit.configs.recommended.rules)
      .concat(['no-restricted-imports', 'no-restricted-globals'])
      .map((rule) => [rule, 'off'])
  );
}

/**
 * Splits into two config blocks: `plain` (`.ts`/`.js`/etc.) has these rules turned off, since
 * oxlint's `qunit` jsPlugin now covers them; `templateTag` (`.gts`/`.gjs`) keeps the full rule
 * set, since oxlint's parser can't scan those. Either key is omitted if no files in `config.files`
 * matched that extension group.
 *
 * @return {{ plain?: import('eslint').Linter.FlatConfig, templateTag?: import('eslint').Linter.FlatConfig }}
 */
export function ember(config = {}) {
  config.allowedImports = Array.isArray(config.allowedImports)
    ? config.allowedImports.concat(QUNIT_IMPORTS)
    : QUNIT_IMPORTS.slice();

  config.files = config.files || ['tests/**/*.{js,ts,gjs,gts}'];

  const { plain, templateTag } = splitByExtension(config.files);
  const result = {};

  if (plain.length) {
    result.plain = {
      files: plain,
      plugins: plugins(),
      rules: disabledRules(),
    };
  }

  if (templateTag.length) {
    result.templateTag = {
      files: templateTag,
      plugins: plugins(),
      rules: rules(config),
    };
  }

  return result;
}

/** @return {import('eslint').Linter.FlatConfig[]} */
export function toArray(result) {
  return Object.values(result).filter(Boolean);
}

/** @return {import('eslint').Linter.FlatConfig[]} */
export function node(config = {}) {
  config.allowedImports = Array.isArray(config.allowedImports) ? config.allowedImports.concat(['qunit']) : ['qunit'];

  return [
    {
      files: config.files || ['tests/**/*.{js,ts}'],
      plugins: plugins(),
      rules: disabledRules(),
    },
  ];
}
