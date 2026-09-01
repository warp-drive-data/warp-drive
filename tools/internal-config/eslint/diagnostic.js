import * as isolation from './isolation.js';
import * as qunit from './qunit.js';

const QUNIT_BANNED_IMPORTS = ['ember-qunit', 'qunit', 'ember-exam'];

/** @return {import('eslint').Linter.FlatConfig[]} */
export function browser(config = {}) {
  const { plain, templateTag } = qunit.ember(config);

  // Only the `.gts`/`.gjs` block (the one still fully enforced by ESLint) needs these extra
  // overrides layered on — the plain `.ts`/`.js` block already has every one of these rules off.
  if (templateTag) {
    templateTag.rules = Object.assign(
      templateTag.rules,
      {
        'qunit/no-assert-equal': 'off',
      },
      isolation.rules({
        allowedImports: ['@ember/test-helpers', '@ember/test-waiters', ...(config.allowedImports ?? [])].filter(
          (v) => !QUNIT_BANNED_IMPORTS.includes(v)
        ),
      }),
      config.rules ?? {}
    );
  }

  return [plain, templateTag].filter(Boolean);
}
