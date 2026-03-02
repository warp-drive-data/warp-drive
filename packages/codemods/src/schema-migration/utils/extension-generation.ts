import type { SgNode } from '@ast-grep/napi';
import { parse } from '@ast-grep/napi';
import { dirname, join, relative, resolve, sep } from 'path';

import { logger } from '../../../utils/logger.js';
import type { TransformOptions } from '../config.js';
import type { SchemaArtifact } from './artifact.js';
import { getFileExtension, getLanguageFromPath, indentCode, removeQuotes } from './path-utils.js';
import type { TransformArtifact } from './schema-generation.js';
import {
  EXPORT_DEFAULT_LINE_END_REGEX,
  EXPORT_LINE_END_REGEX,
  extractDirectory,
  removeFileExtension,
  removeSameDirPrefix,
} from './string.js';

const log = logger.for('extension-generation');

/**
 * Extension artifact context - determines where the extension file is placed
 */
export type ExtensionContext = 'resource' | 'trait';

/**
 * Get the artifact type for an extension based on its context
 */
export function getExtensionArtifactType(context: SchemaArtifact): string {
  return context.type === 'trait' ? 'trait-extension' : 'resource-extension';
}

/**
 * Generate extension code in either object or class format
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export function generateExtensionCode(
  config: SchemaArtifact,
  extensionProperties: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
  format: 'object' | 'class' = 'object',
  interfaceImportPath?: string
): string {
  if (format === 'class') {
    // Class format used by model-to-schema transform
    const methods = extensionProperties
      .map((prop) => {
        // For class-based extension code, preserve everything exactly as-is
        // The AST already contains the proper syntax, formatting, and structure
        return indentCode(prop.value);
      })
      .join('\n\n');

    const classCode = `export class ${config.identifiers.extension} {\n${methods}\n}`;
    const exportDefault = `export default ${config.identifiers.extension};`;

    // Add interface extension for TypeScript files or JSDoc for JavaScript files
    if (config.extensionIsTyped) {
      // Add import if interfaceImportPath is provided
      const importStatement = interfaceImportPath
        ? `import type { ${config.identifiers.type} } from '${interfaceImportPath}';\n\n`
        : '';
      // Put interface before class for better visibility
      return `${importStatement}export interface ${config.identifiers.extension} extends ${config.identifiers.type} {}\n\n${classCode}\n\n${exportDefault}`;
    }

    // For JavaScript files, don't add JSDoc import here since it's handled by the base class pattern
    return `${classCode}\n\n${exportDefault}`;
  }

  // Object format used by mixin-to-schema transform
  const properties = extensionProperties
    .map((prop) => {
      // If this is an object method syntax (method, getter, setter, etc.), use as-is
      if (prop.isObjectMethod) {
        return `  ${prop.value}`;
      }

      // For regular properties, use key: value syntax
      const key = prop.originalKey;
      return `  ${key}: ${prop.value}`;
    })
    .join(',\n');

  const objectCode = `export const ${config.identifiers.extension} = {\n${properties}\n};`;

  if (config.extensionIsTyped && config.identifiers.type) {
    const importStatement = interfaceImportPath
      ? `import type { ${config.identifiers.type} } from '${interfaceImportPath}';\n\n`
      : '';
    return `${importStatement}export interface ${config.identifiers.extension} extends ${config.identifiers.type} {}\n\n${objectCode}`;
  }

  return objectCode;
}


/**
 * Remove imports that are not needed in extension artifacts
 * This only removes fragment imports since they're not needed in schema-record
 */
function removeUnnecessaryImports(source: string, options?: TransformOptions): string {
  const linesToRemove = ['ember-data-model-fragments/attributes', '@ember/object/mixin', '/mixins/'];

  const lines = source.split('\n');
  const filteredLines = lines.filter((line) => {
    // Check if this line is an import statement that should be removed
    if (line.trim().startsWith('import ')) {
      return !linesToRemove.some((importToRemove) => line.includes(importToRemove));
    }
    return true;
  });

  return filteredLines.join('\n');
}

/**
 * Calculate correct relative import path when moving a file to a different directory
 */
function calculateRelativeImportPath(
  sourceFilePath: string, // Original model file location
  targetFilePath: string, // Extension file location
  importedFilePath: string // What the relative import points to
): string {
  const sourceDir = dirname(sourceFilePath);
  const absoluteImportPath = resolve(sourceDir, importedFilePath);
  const targetDir = dirname(targetFilePath);
  const newRelativePath = relative(targetDir, absoluteImportPath);

  // Normalize and ensure ./ or ../ prefix
  // Use forward slashes for import paths (even on Windows)
  const normalized = newRelativePath.split(sep).join('/');
  return normalized.startsWith('.') ? normalized : './' + normalized;
}

/**
 * Update relative imports when moving from models/ to extensions/
 * Uses directoryImportMapping to resolve relative imports to their original packages
 */
function updateRelativeImportsForExtensions(
  source: string,
  root: SgNode,
  options?: TransformOptions,
  sourceFilePath?: string,
  targetFilePath?: string
): string {
  let result = source;

  // Find all import statements
  const imports = root.findAll({ rule: { kind: 'import_statement' } });

  for (const importNode of imports) {
    const sourceField = importNode.field('source');
    if (!sourceField) continue;

    const importSource = sourceField.text();
    const importPath = removeQuotes(importSource);

    // Transform relative imports to reference the appropriate package
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      let absoluteImportPath: string | undefined;

      // First try directory import mapping if available
      if (options?.directoryImportMapping && sourceFilePath) {
        // Extract the base directory structure from the source file
        const sourceDir = extractDirectory(sourceFilePath);

        // Look for a mapping that matches the source directory structure
        for (const [mappedDir, importBase] of Object.entries(options.directoryImportMapping)) {
          if (sourceDir.includes(mappedDir)) {
            // Calculate the resolved path from the source directory
            let resolvedPath: string;

            if (importPath.startsWith('./')) {
              // Same directory: ./file -> {importBase}/{currentDir}/file
              const mappedDirIndex = sourceDir.indexOf(mappedDir);
              if (mappedDirIndex !== -1) {
                const sourceRelativeDir = sourceDir.substring(mappedDirIndex + mappedDir.length);
                const sourceParts = sourceRelativeDir.split('/').filter((part) => part !== '');
                const filePath = removeFileExtension(removeSameDirPrefix(importPath));

                if (sourceParts.length > 0) {
                  resolvedPath = `${importBase}/${sourceParts.join('/')}/${filePath}`;
                } else {
                  resolvedPath = `${importBase}/${filePath}`;
                }
              } else {
                const filePath = removeFileExtension(removeSameDirPrefix(importPath));
                resolvedPath = `${importBase}/${filePath}`;
              }
            } else {
              // Parent directory: ../file -> resolve relative to the source structure
              const mappedDirIndex = sourceDir.indexOf(mappedDir);
              if (mappedDirIndex !== -1) {
                // Get the directory part of the source file relative to the mapped directory
                const sourceRelativeDir = sourceDir.substring(mappedDirIndex + mappedDir.length);
                const sourceParts = sourceRelativeDir.split('/').filter((part) => part !== '');

                // Parse the relative import path
                const relativePath = removeFileExtension(importPath);
                const importParts = relativePath.split('/');

                // Start from the current directory (sourceParts)
                const resultParts = [...sourceParts];

                // Process the import parts
                for (const part of importParts) {
                  if (part === '..') {
                    resultParts.pop(); // Go up one directory
                  } else if (part !== '.' && part !== '') {
                    resultParts.push(part);
                  }
                }

                // Build the final import path
                resolvedPath = `${importBase}/${resultParts.join('/')}`;
              } else {
                // Fallback if we can't resolve the structure
                resolvedPath = importPath;
              }
            }

            absoluteImportPath = resolvedPath;
            break;
          }
        }
      }

      // Fallback to modelImportSource for ./ imports only
      if (!absoluteImportPath && importPath.startsWith('./') && options?.modelImportSource) {
        const filePath = removeFileExtension(removeSameDirPrefix(importPath));
        absoluteImportPath = `${options.modelImportSource}/${filePath}`;
      }

      if (absoluteImportPath) {
        const newImportSource = importSource.replace(importPath, absoluteImportPath);
        result = result.replace(importSource, newImportSource);
      } else {
        // Dynamic calculation if we have both source and target paths
        if (targetFilePath && sourceFilePath) {
          const newRelativePath = calculateRelativeImportPath(sourceFilePath, targetFilePath, importPath);
          const newImportSource = importSource.replace(importPath, newRelativePath);
          result = result.replace(importSource, newImportSource);
        } else {
          // Final fallback to relative path adjustment (hardcoded assumptions)
          if (importPath.startsWith('./')) {
            const newPath = importPath.replace('./', '../../models/');
            const newImportSource = importSource.replace(importPath, newPath);
            result = result.replace(importSource, newImportSource);
          } else if (importPath.startsWith('../')) {
            // Transform ../file to ../../file (going up one more level)
            const newPath = importPath.replace('../', '../../');
            const newImportSource = importSource.replace(importPath, newPath);
            result = result.replace(importSource, newImportSource);
          }
        }
      }
    }
  }

  return result;
}

/**
 * "Extensions" are whatever remains of a Model or Mixin after we extract all
 * of the schema-related information.
 *
 * For instance for a Model, this means dropping extension of the base class,
 * and dropping any properties decorated with @attr @hasMany or @belongsTo,
 * as well as any imports or local definitions that are only used by those
 * properties.
 */
export function createExtensionFromOriginalFile(
  schemaConfig: SchemaArtifact,
  filePath: string,
  source: string,
  extensionProperties: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
  options?: TransformOptions,
  interfaceImportPath?: string,
  sourceType: 'mixin' | 'model' = 'model',
  processImports?: (source: string, filePath: string, baseDir: string, options?: TransformOptions) => string
): TransformArtifact | null {
  if (extensionProperties.length === 0) {
    return null;
  }

  try {
    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    log.debug(`Creating extension from ${filePath} with ${extensionProperties.length} properties`);

    const extFileName = `${schemaConfig.name}.ext${getFileExtension(filePath)}`;

    const targetDir =
      schemaConfig.type === 'trait'
        ? options?.traitsDir || './app/data/traits'
        : options?.resourcesDir || './app/data/resources';
    const targetFilePath = join(resolve(targetDir), extFileName);

    // Update relative imports for the new extension location
    const updatedSource = updateRelativeImportsForExtensions(source, root, options, filePath, targetFilePath);
    log.debug(`Updated relative imports in source`);

    // Determine format based on source type: mixins use object format, models use class format
    const format = sourceType === 'mixin' ? 'object' : 'class';

    log.debug(`Extension generation for ${sourceType} using ${format} format`);

    const extensionCode = generateExtensionCode(schemaConfig, extensionProperties, format, interfaceImportPath);

    // Use a simpler approach: remove the main class and append extension code
    let modifiedSource = updatedSource;

    // The main class will be handled in the export processing loop below
    const allExports = root.findAll({ rule: { kind: 'export_statement' } });
    log.debug(`Found ${allExports.length} export statements to process`);
    // for (const exportNode of allExports) {
    //   const exportText = exportNode.text();
    //   log.debug(`Processing export: ${exportText.substring(0, 100)}...`);

    //   // Check if this is the default export (the main model class)
    //   const isDefaultExport = exportText.includes('export default');
    //   if (isDefaultExport) {
    //     log.debug(`Removing default export (main model class)`);
    //     modifiedSource = modifiedSource.replace(exportText, '');
    //     continue;
    //   }

    //   // Check if this is a type definition that should remain exported
    //   if (shouldKeepExported(exportNode)) {
    //     log.debug(`Keeping export for type definition: ${exportText.substring(0, 50)}...`);
    //     continue;
    //   }

    //   // For non-type exports, remove the export keyword but keep the content
    //   // Simply replace "export " with empty string
    //   const contentWithoutExport = exportText.replace(EXPORT_KEYWORD_REGEX, '');
    //   log.debug(`Removing export keyword, keeping content: ${contentWithoutExport.substring(0, 50)}...`);
    //   modifiedSource = modifiedSource.replace(exportText, contentWithoutExport);
    // }

    // Process imports to resolve relative imports to absolute imports
    const baseDir = process.cwd();
    log.debug(`Processing imports for extension file: ${filePath}`);
    if (processImports) {
      modifiedSource = processImports(modifiedSource, filePath, baseDir, options);
    }

    // Remove fragment imports only from model extensions (not mixin extensions)
    if (sourceType === 'model') {
      modifiedSource = removeUnnecessaryImports(modifiedSource, options);
    }

    // Clean up extra whitespace and add the extension code
    modifiedSource = modifiedSource.trim() + '\n\n' + extensionCode;

    // Clean up any stray export keywords
    modifiedSource = modifiedSource.replace(EXPORT_DEFAULT_LINE_END_REGEX, '');
    modifiedSource = modifiedSource.replace(EXPORT_LINE_END_REGEX, '');

    log.debug(`Generated extension code (first 200 chars): ${modifiedSource.substring(0, 200)}...`);
    log.debug(`Extension code to add: ${extensionCode.substring(0, 200)}...`);

    return {
      baseName: schemaConfig.name,
      type: getExtensionArtifactType(schemaConfig),
      name: schemaConfig.identifiers.extension!,
      code: modifiedSource,
      suggestedFileName: extFileName,
    };
  } catch (error) {
    log.warn(`Error creating extension from original file: ${String(error)}`);
    return null;
  }
}
