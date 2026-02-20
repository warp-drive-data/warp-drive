import type { Lang } from '@ast-grep/napi';
import { Lang as AstLang } from '@ast-grep/napi';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';

import type { TransformOptions } from '../config.js';
import {
  capitalizeFirstLetter,
  capitalizeWord,
  FILE_EXTENSION_REGEX,
  KEBAB_TO_CAMEL_REGEX,
  kebabLetterToUpper,
  LEADING_HYPHEN_REGEX,
  SURROUNDING_QUOTES_REGEX,
  UPPERCASE_LETTER_REGEX,
  WHITESPACE_REGEX,
  WORD_BOUNDARY_REGEX,
  WORD_SEPARATOR_REGEX,
} from './string.js';

/**
 * Extract the file name (without extension) from a file path
 */
function extractFileNameWithoutExtension(filePath: string): string {
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
  return fileName.replace(FILE_EXTENSION_REGEX, '');
}

/**
 * Extract kebab-case base name (without extension) from a file path
 */
export function extractBaseName(filePath: string): string {
  return extractFileNameWithoutExtension(filePath);
}

/**
 * Extract camelCase name from file path (kebab-case to camelCase conversion)
 */
export function extractCamelCaseName(filePath: string): string {
  const baseName = extractFileNameWithoutExtension(filePath);

  // Convert kebab-case to camelCase for valid JavaScript identifier
  // test-plannable -> testPlannable
  return baseName.replace(KEBAB_TO_CAMEL_REGEX, kebabLetterToUpper);
}

/**
 * Convert kebab-case to PascalCase for model/mixin names
 * user-profile -> UserProfile
 */
export function extractPascalCaseName(filePath: string): string {
  const baseName = extractFileNameWithoutExtension(filePath);

  return baseName.split('-').map(capitalizeFirstLetter).join('');
}

/**
 * Convert kebab-case or snake_case to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(WORD_SEPARATOR_REGEX, ' ')
    .replace(WORD_BOUNDARY_REGEX, capitalizeWord)
    .replace(WHITESPACE_REGEX, '');
}

/**
 * Convert mixin name to trait name (e.g., "BaseModelMixin" -> "baseModel")
 * When forStringReference is true, returns dasherized format (e.g., "base-model")
 * Handles both mixin names and import paths
 */
export function mixinNameToTraitName(mixinNameOrPath: string, forStringReference = false): string {
  let traitName = mixinNameOrPath;

  // If this looks like a file path, extract the base name
  if (traitName.includes('/') || traitName.includes('\\')) {
    const fileName = traitName.split('/').pop() || traitName.split('\\').pop() || traitName;
    traitName = fileName.replace(FILE_EXTENSION_REGEX, '');

    // Convert kebab-case file name to PascalCase
    traitName = traitName.split('-').map(capitalizeFirstLetter).join('');
  }

  if (traitName.endsWith('Mixin')) {
    traitName = traitName.slice(0, -5); // Remove 'Mixin' suffix
  }

  if (forStringReference) {
    // Convert PascalCase to kebab-case for string references
    return traitName.replace(UPPERCASE_LETTER_REGEX, '-$1').toLowerCase().replace(LEADING_HYPHEN_REGEX, ''); // Remove leading dash if present
  }

  // Convert PascalCase to camelCase for const names
  const baseName = traitName.charAt(0).toLowerCase() + traitName.slice(1);
  return baseName;
}

/**
 * Remove surrounding quotes from a string (single or double quotes)
 */
export function removeQuotes(text: string): string {
  return text.replace(SURROUNDING_QUOTES_REGEX, '');
}

/**
 * Determine AST language from file path
 */
export function getLanguageFromPath(filePath: string): Lang {
  if (filePath.endsWith('.ts')) {
    return AstLang.TypeScript;
  } else if (filePath.endsWith('.js')) {
    return AstLang.JavaScript;
  }

  // Default to TypeScript for unknown extensions
  return AstLang.TypeScript;
}

/**
 * Extract file extension from path (.js or .ts)
 */
export function getFileExtension(filePath: string): string {
  if (filePath.endsWith('.ts')) {
    return '.ts';
  } else if (filePath.endsWith('.js')) {
    return '.js';
  }

  // Default to .ts for unknown extensions
  return '.ts';
}

/**
 * Properly indent code while preserving existing indentation structure
 */
export function indentCode(code: string, indentLevel = 1): string {
  const indent = '  '.repeat(indentLevel);
  return code
    .split('\n')
    .map((line, index) => {
      if (index === 0) {
        return `${indent}${line}`;
      }
      // Preserve empty lines and existing indentation
      return line ? `${indent}${line}` : line;
    })
    .join('\n');
}

/**
 * Configuration for import source resolution
 */
export interface ImportSourceConfig {
  /** Primary import source prefix (e.g., '@ember-data/model') */
  primarySource?: string;
  /** Primary directory path (e.g., './app/models') */
  primaryDir?: string;
  /** Additional pattern-based sources */
  additionalSources?: Array<{ pattern: string; dir: string }>;
}

/** Default file extensions to try when resolving imports */
const DEFAULT_EXTENSIONS = ['.ts', '.js'];

/**
 * Convert a glob/wildcard pattern to a regex
 * e.g., 'my-app/models/*' -> /^my-app/models\/(.*)$/
 */
function wildcardPatternToRegex(pattern: string): RegExp {
  return new RegExp('^' + pattern.replace(/\*/g, '(.*)') + '$');
}

/**
 * Replace wildcards in a pattern with matched values
 * e.g., pattern: 'my-app/models/*', value: 'my-app/models/user', replacement: './app/models/*'
 *      -> './app/models/user'
 */
export function replaceWildcardPattern(pattern: string, value: string, replacement: string): string | null {
  if (pattern.includes('*')) {
    const regex = wildcardPatternToRegex(pattern);
    const match = value.match(regex);

    if (match) {
      let result = replacement;
      for (let i = 1; i < match.length; i++) {
        result = result.replace('*', match[i]);
      }
      return result;
    }
    return null;
  }

  // For exact matches, simple replacement
  return value.replace(pattern, replacement);
}

/**
 * Try to find a file with various extensions
 */
function resolveWithExtensions(basePath: string, extensions: string[] = DEFAULT_EXTENSIONS): string | null {
  // First try the base path as-is
  if (existsSync(basePath)) {
    return basePath;
  }

  // Then try with extensions
  for (const ext of extensions) {
    const pathWithExt = `${basePath}${ext}`;
    if (existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }

  // Try index files (e.g., basePath/index.ts, basePath/index.js)
  for (const ext of extensions) {
    const indexPath = resolve(basePath, 'index' + ext);
    if (existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

/**
 * Resolve a relative import path to an absolute file path
 */
export function resolveRelativeImport(importPath: string, fromFile: string, baseDir: string): string | null {
  if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
    return null;
  }

  try {
    const fromDir = dirname(fromFile);
    const resolvedPath = resolve(fromDir, importPath);
    return resolveWithExtensions(resolvedPath);
  } catch {
    return null;
  }
}

/**
 * Resolve an import path using configured sources
 * This handles both absolute imports (with patterns) and provides fallback logic
 */
export function resolveImportPath(
  importPath: string,
  config: ImportSourceConfig,
  currentFilePath?: string,
  baseDir?: string
): string | null {
  // Handle relative imports if file context is provided
  if (currentFilePath && baseDir && (importPath.startsWith('./') || importPath.startsWith('../'))) {
    const resolved = resolveRelativeImport(importPath, currentFilePath, baseDir);
    if (resolved) {
      return resolved;
    }
  }

  // Try primary source first
  if (config.primarySource && config.primaryDir) {
    if (importPath.startsWith(config.primarySource)) {
      const relativePath = importPath.replace(config.primarySource + '/', '');
      const fullPath = resolve(config.primaryDir, relativePath);
      const resolved = resolveWithExtensions(fullPath);
      if (resolved) {
        return resolved;
      }
    }
  }

  // Try additional sources with pattern matching
  if (config.additionalSources) {
    for (const source of config.additionalSources) {
      const replacement = replaceWildcardPattern(source.pattern, importPath, source.dir);
      if (replacement) {
        const resolved = resolveWithExtensions(replacement);
        if (resolved) {
          return resolved;
        }
      }
    }
  }

  return null;
}

/**
 * Check if an import path matches a configured source
 */
export function isImportFromSource(
  importPath: string,
  sourceType: 'model' | 'mixin',
  options?: TransformOptions
): boolean {
  const config = getImportSourceConfig(sourceType, options);

  // Check primary source
  if (config.primarySource && importPath.startsWith(config.primarySource)) {
    return true;
  }

  // Check additional sources
  if (config.additionalSources) {
    for (const source of config.additionalSources) {
      if (importPath.startsWith(source.pattern.replace('/*', ''))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get import source configuration from TransformOptions
 */
export function getImportSourceConfig(sourceType: 'model' | 'mixin', options?: TransformOptions): ImportSourceConfig {
  if (sourceType === 'model') {
    return {
      primarySource: options?.modelImportSource,
      primaryDir: options?.modelSourceDir,
      additionalSources: options?.additionalModelSources,
    };
  }

  return {
    primarySource: options?.mixinImportSource,
    primaryDir: options?.mixinSourceDir,
    additionalSources: options?.additionalMixinSources,
  };
}
