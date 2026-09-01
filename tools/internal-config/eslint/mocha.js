import mochaPlugin from 'eslint-plugin-mocha';

import * as node from './node.js';

export function cjs(config = {}) {
  config.files = config.files || ['tests/**/*.{js,ts}'];
  const base = node.cjs(config);
  const recommended = mochaPlugin.configs.recommended;

  base.plugins = Object.assign(base.plugins, recommended.plugins);
  base.rules = Object.assign(base.rules, recommended.rules, {
    // We use setup to set up beforeEach hooks, etc, which should be OK
    'mocha/no-setup-in-suite': 'off',
  });

  // oxlint's `mocha` jsPlugin (see `.oxlintrc.json`'s `jsPlugins`) already covers these rules
  // for the test files this targets — config files (babel/rollup/etc. configs, also matched by
  // `node.cjs()`'s base `files`) aren't in oxlint's scope, so this override is scoped to just
  // `config.files`, not `base.files`.
  const disabledOverride = {
    files: config.files,
    rules: Object.fromEntries(Object.keys(recommended.rules).map((rule) => [rule, 'off'])),
  };

  return [base, disabledOverride];
}
