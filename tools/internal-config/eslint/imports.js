import ImportPlugin from 'eslint-plugin-import-x';

// Import order is enforced by oxfmt's `sortImports` (see .oxfmtrc.jsonc), not ESLint.
export function rules() {
  return {
    // Imports
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
  };
}

export function plugins() {
  return {
    import: ImportPlugin,
  };
}
