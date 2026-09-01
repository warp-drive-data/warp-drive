import * as isolation from './isolation.js';
import * as qunit from './qunit.js';

const QUNIT_BANNED_IMPORTS = ['ember-qunit', 'qunit', 'ember-exam'];

function withTemplateTagOverrides(config, templateTag) {
  if (!templateTag) return templateTag;

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

  return templateTag;
}

/** @return {import('eslint').Linter.FlatConfig[]} */
export function browser(config = {}) {
  const { plain, templateTag } = qunit.ember(config);

  // Only the `.gts`/`.gjs` block (the one still fully enforced by ESLint) needs these extra
  // overrides layered on — the plain `.ts`/`.js` block already has every one of these rules off.
  return [plain, withTemplateTagOverrides(config, templateTag)].filter(Boolean);
}

// For packages where oxlint's `qunit` jsPlugin already fully covers plain `.ts`/`.js` test
// files — only the `.gts`/`.gjs` block ESLint still needs to enforce.
/** @return {import('eslint').Linter.FlatConfig | undefined} */
export function templateTag(config = {}) {
  const { templateTag } = qunit.ember(config);
  return withTemplateTagOverrides(config, templateTag);
}
