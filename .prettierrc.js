// Scoped to *.gjs/*.gts only — oxfmt (.oxfmtrc.jsonc) formats everything else.
// prettier-plugin-ember-template-tag is the only formatter that understands
// Ember's <template> tag syntax inside these files; oxfmt doesn't support it yet.
// See https://github.com/oxc-project/oxc/issues/19964
module.exports = {
  plugins: ['prettier-plugin-ember-template-tag'],
  trailingComma: 'es5',
  printWidth: 120,
  singleQuote: true,
  templateSingleQuote: false,
};
