import type { SgNode } from '@ast-grep/napi';
import { parse } from '@ast-grep/napi';
import { dirname, join, relative, resolve, sep } from 'path';

import type { TransformOptions } from '../config.js';
import { debugLog, errorLog } from './logging.js';
import { getFileExtension, getLanguageFromPath, indentCode, removeQuotes } from './path-utils.js';
import type { TransformArtifact } from './schema-generation.js';
import {
  EXPORT_DEFAULT_LINE_END_REGEX,
  EXPORT_KEYWORD_REGEX,
  EXPORT_LINE_END_REGEX,
  extractDirectory,
  removeFileExtension,
  removeSameDirPrefix,
} from './string.js';

/**
 * Extension artifact context - determines where the extension file is placed
 */
export type ExtensionContext = 'resource' | 'trait';

/**
 * Get the artifact type for an extension based on its context
 */
export function getExtensionArtifactType(context: ExtensionContext): string {
  return context === 'trait' ? 'trait-extension' : 'resource-extension';
}

/**
 * Generate extension code in either object or class format
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export function generateExtensionCode(
  extensionName: string,
  extensionProperties: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
  format: 'object' | 'class' = 'object',
  interfaceToExtend?: string,
  isTypeScript = true,
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

    const classCode = `export class ${extensionName} {\n${methods}\n}`;

    // Add interface extension for TypeScript files or JSDoc for JavaScript files
    if (interfaceToExtend) {
      if (isTypeScript) {
        // Add import if interfaceImportPath is provided
        const importStatement = interfaceImportPath
          ? `import type { ${interfaceToExtend} } from '${interfaceImportPath}';\n\n`
          : '';
        // Put interface before class for better visibility
        return `${importStatement}export interface ${extensionName} extends ${interfaceToExtend} {}\n\n${classCode}`;
      }
      // For JavaScript files, don't add JSDoc import here since it's handled by the base class pattern
      return classCode;
    }

    return classCode;
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

  const objectCode = `export const ${extensionName} = {\n${properties}\n};`;

  // Add interface extension for TypeScript files or JSDoc for JavaScript files
  if (interfaceToExtend) {
    if (isTypeScript) {
      // Add import if interfaceImportPath is provided
      const importStatement = interfaceImportPath
        ? `import type { ${interfaceToExtend} } from '${interfaceImportPath}';\n\n`
        : '';
      // Put interface before object for better visibility
      return `${importStatement}export interface ${extensionName} extends ${interfaceToExtend} {}\n\n${objectCode}`;
    }
    // For JavaScript files, don't add JSDoc import here since it's handled by the base class pattern
    return objectCode;
  }

  return objectCode;
}

/**
 * Determine if an export statement should remain exported in the extension file.
 * We keep interfaces and type aliases exported so they can be imported by other files.
 * Other declarations (classes, functions, consts) become internal to the extension.
 */
function shouldKeepExported(exportNode: SgNode): boolean {
  // Get the declaration being exported
  const declaration = exportNode.field('declaration');
  if (!declaration) return false;

  const kind = declaration.kind();

  // Keep interface and type alias declarations exported
  return kind === 'interface_declaration' || kind === 'type_alias_declaration';
}

/**
 * Remove imports that are not needed in extension artifacts
 * This only removes fragment imports since they're not needed in schema-record
 */
function removeUnnecessaryImports(source: string, options?: TransformOptions): string {
  const linesToRemove = ['ember-data-model-fragments/attributes'];

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
 * Append extension signature type alias to an extension artifact
 * This creates a TypeScript type alias like: export type UserExtensionSignature = typeof UserExtension;
 */
export function appendExtensionSignatureType(extensionArtifact: TransformArtifact, entityName: string): void {
  const isTypeScript = extensionArtifact.suggestedFileName.endsWith('.ts');
  if (!isTypeScript) {
    return;
  }

  const signatureType = `${entityName}ExtensionSignature`;
  const className = `${entityName}Extension`;
  const signatureCode = `export type ${signatureType} = typeof ${className};`;

  extensionArtifact.code += '\n\n' + signatureCode;
}

/**
 * Create extension artifact by modifying the original file using AST
 * This preserves all imports, comments, and structure while replacing the class/export
 */
export function createExtensionFromOriginalFile(
  filePath: string,
  source: string,
  baseName: string,
  extensionName: string,
  extensionProperties: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
  options?: TransformOptions,
  interfaceToExtend?: string,
  interfaceImportPath?: string,
  sourceType: 'mixin' | 'model' = 'model',
  processImports?: (source: string, filePath: string, baseDir: string, options?: TransformOptions) => string,
  extensionContext: ExtensionContext = 'resource'
): TransformArtifact | null {
  if (extensionProperties.length === 0) {
    return null;
  }

  try {
    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    debugLog(options, `Creating extension from ${filePath} with ${extensionProperties.length} properties`);

    const extFileName = `${baseName}.ext${getFileExtension(filePath)}`;

    const targetDir =
      extensionContext === 'trait'
        ? options?.traitsDir || './app/data/traits'
        : options?.resourcesDir || './app/data/resources';
    const targetFilePath = join(resolve(targetDir), extFileName);

    // Update relative imports for the new extension location
    const updatedSource = updateRelativeImportsForExtensions(source, root, options, filePath, targetFilePath);
    debugLog(options, `Updated relative imports in source`);

    // Determine format based on source type: mixins use object format, models use class format
    const format = sourceType === 'mixin' ? 'object' : 'class';

    debugLog(options, `Extension generation for ${sourceType} using ${format} format`);

    const extensionCode = generateExtensionCode(
      extensionName,
      extensionProperties,
      format,
      interfaceToExtend,
      filePath.endsWith('.ts'),
      interfaceImportPath
    );

    // Use a simpler approach: remove the main class and append extension code
    let modifiedSource = updatedSource;

    // The main class will be handled in the export processing loop below

    // Remove all export statements except the default export, but preserve their content
    const allExports = root.findAll({ rule: { kind: 'export_statement' } });
    debugLog(options, `Found ${allExports.length} export statements to process`);
    for (const exportNode of allExports) {
      const exportText = exportNode.text();
      debugLog(options, `Processing export: ${exportText.substring(0, 100)}...`);

      // Check if this is the default export (the main model class)
      const isDefaultExport = exportText.includes('export default');
      if (isDefaultExport) {
        debugLog(options, `Removing default export (main model class)`);
        modifiedSource = modifiedSource.replace(exportText, '');
        continue;
      }

      // Check if this is a type definition that should remain exported
      if (shouldKeepExported(exportNode)) {
        debugLog(options, `Keeping export for type definition: ${exportText.substring(0, 50)}...`);
        continue;
      }

      // For non-type exports, remove the export keyword but keep the content
      // Simply replace "export " with empty string
      const contentWithoutExport = exportText.replace(EXPORT_KEYWORD_REGEX, '');
      debugLog(options, `Removing export keyword, keeping content: ${contentWithoutExport.substring(0, 50)}...`);
      modifiedSource = modifiedSource.replace(exportText, contentWithoutExport);
    }

    // Process imports to resolve relative imports to absolute imports
    const baseDir = process.cwd();
    debugLog(options, `Processing imports for extension file: ${filePath}`);
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

    debugLog(options, `Generated extension code (first 200 chars): ${modifiedSource.substring(0, 200)}...`);
    debugLog(options, `Extension code to add: ${extensionCode.substring(0, 200)}...`);

    return {
      type: getExtensionArtifactType(extensionContext),
      name: extensionName,
      code: modifiedSource,
      suggestedFileName: extFileName,
    };
  } catch (error) {
    errorLog(options, `Error creating extension from original file: ${String(error)}`);
    return null;
  }
}
