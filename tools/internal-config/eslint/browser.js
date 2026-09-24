// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

import * as imports from './imports.js';
import * as isolation from './isolation.js';
import * as oxlint from './oxlint.js';
import { splitByExtension } from './split-files.js';
import * as ts from './typescript.js';

// function resolve(name) {
//   const fullPath = import.meta.resolve(name);
//   if (fullPath.startsWith('file://')) {
//     return fullPath.slice(7);
//   }
// }

export function rules(config = {}) {
  const ourRules = {
    eqeqeq: 'error',
    'new-cap': ['error', { capIsNew: false }],
    'no-caller': 'error',
    'no-cond-assign': ['error', 'except-parens'],
    'no-console': 'error', // no longer recommended in eslint v6, this restores it
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-unused-vars': ['error', { args: 'none' }],

    // Too many false positives
    // See https://github.com/eslint/eslint/issues/11899 and similar
    'require-atomic-updates': 'off',

    'prefer-rest-params': 'off',
    'prefer-const': 'error',
  };

  return Object.assign(
    {},
    js.configs.recommended.rules,
    prettier.rules,
    imports.rules(),
    isolation.rules(config),
    ourRules
  );
}

/**
 * Returns `[base]`, plus a trailing override turning off oxlint's already-covered rules for the
 * non-template-tag subset of `base.files`. oxlint's parser can't scan `.gjs` (see `.oxlintrc.json`'s
 * `ignorePatterns`), so `.gjs` files stay on the full rule set from `base` — the override only
 * matches the plain `.js` patterns split out of `base.files`.
 *
 * Pass `oxlintScoped: false` for packages excluded from `tools/internal-config/oxlint/scoped-dirs.txt`
 * entirely (see that file's header comment, e.g. `packages/internal-exam`) — oxlint never scans
 * these, so ESLint must keep enforcing the full rule set there too.
 *
 * @return {import('eslint').Linter.FlatConfig[]}
 */
export function browser(config = {}) {
  config.files = Array.isArray(config.files) ? config.files : ['**/*.{js,gjs}'];
  const base = ts.browser(config);
  // @ts-expect-error
  base.languageOptions.parserOptions.project = null;
  base.rules = rules(config);
  base.plugins = imports.plugins();

  const result = [base];

  if (config.oxlintScoped !== false) {
    const { plain } = splitByExtension(base.files);

    if (plain.length) {
      result.push({
        files: plain,
        rules: oxlint.disabledRules(),
      });
    }
  }

  return result;
}
