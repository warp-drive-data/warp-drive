/** Matches .js or .ts file extensions at end of string */
export const FILE_EXTENSION_REGEX = /\.(js|ts)$/;

/** Matches .jt or .ts file extensions (alternative pattern) */
export const FILE_EXTENSION_JT_REGEX = /\.[jt]s$/;

/** Matches filename with .js or .ts extension at end of path */
export const FILENAME_WITH_EXTENSION_REGEX = /\/[^/]+\.(js|ts)$/;

/** Matches .schema suffix */
export const SCHEMA_SUFFIX_REGEX = /\.schema$/;

/** Matches kebab-case pattern to convert to camelCase (e.g., -a -> A) */
export const KEBAB_TO_CAMEL_REGEX = /-([a-z])/g;

/** Matches word separators (hyphens and underscores) for PascalCase conversion */
export const WORD_SEPARATOR_REGEX = /[-_]/g;

/** Matches word boundaries for PascalCase capitalization */
export const WORD_BOUNDARY_REGEX = /\w\S*/g;

/** Matches whitespace sequences */
export const WHITESPACE_REGEX = /\s+/g;

/** Matches uppercase letters for camelCase/PascalCase to kebab-case conversion */
export const UPPERCASE_LETTER_REGEX = /([A-Z])/g;

/** Matches camelCase boundary for kebab-case conversion (lowercase followed by uppercase) */
export const CAMEL_CASE_BOUNDARY_REGEX = /([a-z])([A-Z])/g;

/** Matches leading hyphen */
export const LEADING_HYPHEN_REGEX = /^-/;

/** Matches surrounding quotes (single or double) */
export const SURROUNDING_QUOTES_REGEX = /^['"]|['"]$/g;

/** Matches quote characters (single or double) */
export const QUOTE_CHARS_REGEX = /['"]/g;

/** Matches /model at end of string for import path transformation */
export const MODEL_SUFFIX_REGEX = /\/model$/;

/** Matches special regex characters for escaping */
export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/** Extracts the import path from a 'from' statement with single quotes */
export const IMPORT_PATH_SINGLE_QUOTE_REGEX = /from '([^']+)'/;

/** Matches TypeScript 'import type X from' pattern */
export const IMPORT_TYPE_DEFAULT_REGEX = /import\s+type\s+([A-Z][a-zA-Z0-9]*)\s+from/g;

/** Matches regular 'import X from' pattern */
export const IMPORT_DEFAULT_REGEX = /import\s+([A-Z][a-zA-Z0-9]*)\s+from/g;

/** Matches trait or resource schema import paths */
export const SCHEMA_PATH_REGEX = /\/(traits|resources)\/([^/'"]+)\.schema$/;

/** Matches extension import paths (legacy - /extensions/ directory) */
export const EXTENSION_PATH_REGEX = /\/extensions\/([^/'"]+)$/;

/** Matches .ext file import paths (new pattern) */
export const EXT_FILE_PATH_REGEX = /\/([^/'"]+)\.ext$/;

/** Matches relative type import statement: import type X from './path' */
export const RELATIVE_TYPE_IMPORT_REGEX = /import\s+type\s+(\w+)\s+from\s+['"](\.\/.+?)['"];?/;

/** Matches named type import statement: import type { X } from './path' */
export const NAMED_TYPE_IMPORT_REGEX = /import\s+type\s+\{\s*(\w+)\s*\}\s+from\s+['"](\.\/.+?)['"];?/;

/** Matches 'Mixin' suffix at end of string */
export const MIXIN_SUFFIX_REGEX = /Mixin$/;

/** Matches 'Trait' suffix at end of string */
export const TRAIT_SUFFIX_REGEX = /Trait$/;

/** Matches optional -model or model suffix at end (case insensitive) */
export const MODEL_NAME_SUFFIX_REGEX = /-?model$/i;

/** Matches trailing -model or model suffix */
export const TRAILING_MODEL_SUFFIX_REGEX = /-?model$/;

/** Matches wildcard character for pattern matching */
export const WILDCARD_REGEX = /\*/g;

/** Matches backslash for path normalization */
export const BACKSLASH_REGEX = /\\/g;

/** Matches trailing wildcard with optional leading slash */
export const TRAILING_WILDCARD_REGEX = /\/?\*+$/;

/** Matches trailing single wildcard */
export const TRAILING_SINGLE_WILDCARD_REGEX = /\*$/;

/** Matches leading './' for same-directory imports */
export const SAME_DIR_PREFIX_REGEX = /^\.\//;

/** Matches leading '../' for parent-directory imports */
export const PARENT_DIR_PREFIX_REGEX = /^\.\.\//;

/** Matches 'export ' keyword at start of string */
export const EXPORT_KEYWORD_REGEX = /^export\s+/;

/** Matches 'export default' at end of line */
export const EXPORT_DEFAULT_LINE_END_REGEX = /export\s+default\s*$/gm;

/** Matches 'export' at end of line */
export const EXPORT_LINE_END_REGEX = /export\s*$/gm;

/**
 * Capitalizes the first letter of a matched word (for use with replace callback)
 */
export function capitalizeWord(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
}

/**
 * Converts a kebab-case letter match to uppercase (for use with replace callback)
 */
export function kebabLetterToUpper(_match: string, letter: string): string {
  return letter.toUpperCase();
}

/**
 * Capitalizes the first letter of a word, keeping the rest unchanged
 */
export function capitalizeFirstLetter(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Convert camelCase/PascalCase name to kebab-case
 * e.g., "MyModel" -> "my-model", "dataFieldModel" -> "data-field-model"
 */
export function toKebabCase(name: string): string {
  return name.replace(CAMEL_CASE_BOUNDARY_REGEX, '$1-$2').toLowerCase();
}

/**
 * Convert PascalCase name to kebab-case (dasherized format)
 * e.g., "DataField" -> "data-field", "TestMixin" -> "test-mixin"
 */
export function pascalToKebab(name: string): string {
  return name.replace(UPPERCASE_LETTER_REGEX, '-$1').toLowerCase().replace(LEADING_HYPHEN_REGEX, '');
}

/**
 * Convert mixin name to dasherized trait name
 * e.g., "DataFieldMixin" -> "data-field"
 */
export function mixinNameToKebab(mixinName: string): string {
  const baseName = mixinName.replace(MIXIN_SUFFIX_REGEX, '');
  return pascalToKebab(baseName);
}

/**
 * Remove file extension (.js or .ts) from a path
 */
export function removeFileExtension(path: string): string {
  return path.replace(FILE_EXTENSION_REGEX, '');
}

/**
 * Normalize path separators to forward slashes
 */
export function normalizePath(path: string): string {
  return path.replace(BACKSLASH_REGEX, '/');
}

/**
 * Remove quotes from a string (single or double quotes)
 */
export function removeQuoteChars(text: string): string {
  return text.replace(QUOTE_CHARS_REGEX, '');
}

/**
 * Extract directory from a file path by removing the filename
 */
export function extractDirectory(filePath: string): string {
  return filePath.replace(FILENAME_WITH_EXTENSION_REGEX, '');
}

/**
 * Remove leading './' from a path
 */
export function removeSameDirPrefix(path: string): string {
  return path.replace(SAME_DIR_PREFIX_REGEX, '');
}

/**
 * Escape special regex characters in a string for use in RegExp constructor
 */
export function escapeRegexChars(str: string): string {
  return str.replace(REGEX_SPECIAL_CHARS, '\\$&');
}

/**
 * Create a regex to match a quoted import path
 */
export function createQuotedPathRegex(importPath: string): RegExp {
  return new RegExp(`(['"])${escapeRegexChars(importPath)}\\1`);
}
