// oxlint (see ../oxlint/scoped-dirs.txt and the root `.oxlintrc.json`) already runs as a
// fast, additive pass over plain `.ts`/`.tsx`/`.js` sources and enforces the rules below.
// oxlint's parser doesn't support template-tag syntax, so it never scans `.gts`/`.gjs` files
// (see `.oxlintrc.json`'s `ignorePatterns`) — ESLint stays the sole enforcer of these rules
// there, and this list must only be applied to plain `.ts`/`.tsx`/`.js` configs.
//
// This deliberately excludes every rule that requires type information (no-unsafe-*,
// no-floating-promises, require-await, restrict-template-expressions, unbound-method, etc.)
// even though `.oxlintrc.json` lists them as `"error"`: `tools/internal-config/oxlint/run.sh`
// invokes plain `oxlint`, and those rules are no-ops without the `--type-aware` flag oxlint
// requires to enable them (confirmed by running oxlint locally against this repo — none of
// them fired despite dozens of pre-existing violations ESLint's type-aware pass catches).
// ESLint must keep enforcing those until oxlint's type-aware mode is actually wired up.
//
// Keep this in sync with the enabled ("error"), non-type-aware rules in `.oxlintrc.json`'s
// `rules` map.
export const OXLINT_OWNED_RULES = [
  // eslint core
  'eqeqeq',
  'for-direction',
  'new-cap',
  'no-array-constructor',
  'no-async-promise-executor',
  'no-caller',
  'no-case-declarations',
  'no-compare-neg-zero',
  'no-cond-assign',
  'no-console',
  'no-constant-binary-expression',
  'no-constant-condition',
  'no-control-regex',
  'no-debugger',
  'no-delete-var',
  'no-dupe-else-if',
  'no-duplicate-case',
  'no-empty',
  'no-empty-character-class',
  'no-empty-pattern',
  'no-empty-static-block',
  'no-eq-null',
  'no-eval',
  'no-ex-assign',
  'no-extra-boolean-cast',
  'no-fallthrough',
  'no-global-assign',
  'no-invalid-regexp',
  'no-irregular-whitespace',
  'no-loss-of-precision',
  'no-misleading-character-class',
  'no-nonoctal-decimal-escape',
  'no-prototype-builtins',
  'no-regex-spaces',
  'no-restricted-globals',
  'no-restricted-imports',
  'no-self-assign',
  'no-shadow-restricted-names',
  'no-sparse-arrays',
  'no-unassigned-vars',
  'no-unsafe-finally',
  'no-unsafe-optional-chaining',
  'no-unused-labels',
  'no-unused-private-class-members',
  'no-useless-backreference',
  'no-useless-catch',
  'no-useless-escape',
  'no-var',
  'prefer-const',
  'prefer-spread',
  'preserve-caught-error',
  'require-yield',
  'use-isnan',
  'valid-typeof',

  // import (eslint-plugin-import-x rule ids; oxlint's `import` plugin covers the same three)
  'import/first',
  'import/newline-after-import',
  'import/no-duplicates',

  // base rules this config replaces with a TS-aware `@typescript-eslint/*` version below —
  // oxlint enforces the generic version across both `.ts` and `.js`
  'no-loop-func',
  'no-shadow',
  'no-unused-expressions',
  'no-unused-vars',
  'no-useless-constructor',

  // @typescript-eslint (oxlint's `typescript` plugin subset, plus the recommended/strict
  // presets `typescript.js`'s `rules()` pulls in by default) — syntactic rules only; see the
  // note above about excluding anything that needs type information.
  '@typescript-eslint/adjacent-overload-signatures',
  '@typescript-eslint/consistent-type-imports',
  '@typescript-eslint/no-duplicate-enum-values',
  '@typescript-eslint/no-empty-object-type',
  '@typescript-eslint/no-explicit-any',
  '@typescript-eslint/no-extra-non-null-assertion',
  '@typescript-eslint/no-extraneous-class',
  '@typescript-eslint/no-import-type-side-effects',
  '@typescript-eslint/no-inferrable-types',
  '@typescript-eslint/no-misused-new',
  '@typescript-eslint/no-namespace',
  '@typescript-eslint/no-non-null-asserted-nullish-coalescing',
  '@typescript-eslint/no-non-null-asserted-optional-chain',
  '@typescript-eslint/no-require-imports',
  '@typescript-eslint/no-shadow',
  '@typescript-eslint/no-this-alias',
  '@typescript-eslint/no-unnecessary-type-constraint',
  '@typescript-eslint/no-unsafe-function-type',
  '@typescript-eslint/no-unused-expressions',
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/no-useless-constructor',
  '@typescript-eslint/no-wrapper-object-types',
  '@typescript-eslint/prefer-as-const',
  '@typescript-eslint/prefer-literal-enum-member',
  '@typescript-eslint/prefer-namespace-keyword',
  '@typescript-eslint/prefer-ts-expect-error',
  '@typescript-eslint/triple-slash-reference',
];

/** @return {import('eslint').Linter.RulesRecord} */
export function disabledRules() {
  return Object.fromEntries(OXLINT_OWNED_RULES.map((rule) => [rule, 'off']));
}

// The type-aware rules excluded from OXLINT_OWNED_RULES above. oxlint only checks these
// with `--type-aware`, which `tools/internal-config/oxlint/run.sh` runs over the small,
// vetted subset of packages listed in `tools/internal-config/oxlint/type-aware-scoped-dirs.txt`
// (most of this repo's tsconfigs aren't parseable by tsgolint yet — see that file). Within
// that subset, disable the matching ESLint rules per-package (never repo-wide — a package's
// tsgolint results have to be individually verified against real `tsc`/ESLint first; see
// `warp-drive-packages/experiments/eslint.config.mjs` for the one currently verified clean).
export const TYPE_AWARE_OXLINT_RULES = [
  '@typescript-eslint/consistent-type-exports',
  '@typescript-eslint/no-array-delete',
  '@typescript-eslint/no-duplicate-type-constituents',
  '@typescript-eslint/no-floating-promises',
  '@typescript-eslint/no-for-in-array',
  '@typescript-eslint/no-implied-eval',
  '@typescript-eslint/no-meaningless-void-operator',
  '@typescript-eslint/no-unnecessary-type-arguments',
  '@typescript-eslint/no-unnecessary-type-assertion',
  '@typescript-eslint/no-unsafe-argument',
  '@typescript-eslint/no-unsafe-assignment',
  '@typescript-eslint/no-unsafe-call',
  '@typescript-eslint/no-unsafe-enum-comparison',
  '@typescript-eslint/no-unsafe-member-access',
  '@typescript-eslint/no-unsafe-return',
  '@typescript-eslint/no-unsafe-unary-minus',
  '@typescript-eslint/only-throw-error',
  '@typescript-eslint/prefer-includes',
  '@typescript-eslint/prefer-promise-reject-errors',
  '@typescript-eslint/prefer-reduce-type-parameter',
  '@typescript-eslint/prefer-return-this-type',
  '@typescript-eslint/require-await',
  '@typescript-eslint/restrict-plus-operands',
  '@typescript-eslint/restrict-template-expressions',
  '@typescript-eslint/unbound-method',
];

/** @return {import('eslint').Linter.RulesRecord} */
export function disabledTypeAwareRules() {
  return Object.fromEntries(TYPE_AWARE_OXLINT_RULES.map((rule) => [rule, 'off']));
}
