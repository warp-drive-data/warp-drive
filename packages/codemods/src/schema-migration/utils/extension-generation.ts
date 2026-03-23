import { Lang as AstLang, type Lang, parse, type SgNode } from '@ast-grep/napi';
import { dirname, join, relative, resolve, sep } from 'path';

import { logger } from '../../../utils/logger.js';
import type { TransformOptions } from '../config.js';
import { DEFAULT_RESOURCES_DIR, DEFAULT_TRAITS_DIR } from '../config.js';
import type { ArtifactConfig } from './artifact.js';
import { findDefaultExport } from './ast-helpers.js';
import { getModelImportSources } from './import-utils.js';
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

function getImportLocalNames(importNode: SgNode): string[] {
  const names: string[] = [];
  const importClause = importNode.children().find((c) => c.kind() === 'import_clause');
  if (!importClause) return names;

  for (const child of importClause.children()) {
    if (child.kind() === 'identifier') {
      names.push(child.text());
    } else if (child.kind() === 'namespace_import') {
      const id = child.field('name');
      if (id) names.push(id.text());
    } else if (child.kind() === 'named_imports') {
      for (const specifier of child.findAll({ rule: { kind: 'import_specifier' } })) {
        names.push((specifier.field('alias') ?? specifier.field('name'))?.text() ?? '');
      }
    }
  }

  return names.filter(Boolean);
}

/**
 * Check whether any of the given names appear as identifiers in the non-import
 * portion of the source. Checks both value identifiers and type identifiers
 * (e.g., in `extends Foo` within interface declarations) to avoid false removals.
 */
function areAnyNamesUsed(names: string[], nonImportRoot: SgNode, lang: Lang): boolean {
  const nameSet = new Set(names);

  // In TypeScript, interface extends clauses produce `type_identifier` nodes
  // rather than `identifier`, so we must check both kinds.
  // JavaScript grammars don't have `type_identifier`.
  const identifiers = nonImportRoot.findAll({ rule: { kind: 'identifier' } });
  if (identifiers.some((id) => nameSet.has(id.text()))) return true;

  if (lang === AstLang.TypeScript) {
    const typeIdentifiers = nonImportRoot.findAll({ rule: { kind: 'type_identifier' } });
    if (typeIdentifiers.some((id) => nameSet.has(id.text()))) return true;
  }

  return false;
}

/**
 * Shared setup for unused import removal: parse the source, split into
 * import nodes and a non-import AST root for usage checking.
 */
function prepareUnusedImportRemoval(source: string, lang: Lang) {
  const ast = parse(lang, source);
  const root = ast.root();
  const importNodes = root.findAll({ rule: { kind: 'import_statement' } });

  // Build source without imports so identifier lookups only check usage sites
  let nonImportSource = source;
  for (const imp of importNodes) {
    nonImportSource = nonImportSource.replaceAll(imp.text(), '');
  }
  const nonImportRoot = parse(lang, nonImportSource).root();

  return { root, importNodes, nonImportRoot };
}

function removeUnusedImports(source: string, lang: Lang): string {
  const { root, importNodes, nonImportRoot } = prepareUnusedImportRemoval(source, lang);
  if (importNodes.length === 0) return source;

  type Edit = ReturnType<SgNode['replace']>;
  const edits: Edit[] = [];

  for (const imp of importNodes) {
    const localNames = getImportLocalNames(imp);
    if (localNames.length === 0) continue;

    if (!areAnyNamesUsed(localNames, nonImportRoot, lang)) {
      edits.push(imp.replace(''));
    }
  }

  return edits.length > 0 ? root.commitEdits(edits) : source;
}

function removeUnusedTypeImports(source: string, lang: Lang): string {
  const { root, importNodes, nonImportRoot } = prepareUnusedImportRemoval(source, lang);
  if (importNodes.length === 0) return source;

  type Edit = ReturnType<SgNode['replace']>;
  const edits: Edit[] = [];

  for (const imp of importNodes) {
    const text = imp.text();

    // Handle `import type { X } from '...'` statements
    if (text.startsWith('import type')) {
      const localNames = getImportLocalNames(imp);
      if (localNames.length === 0) continue;

      if (!areAnyNamesUsed(localNames, nonImportRoot, lang)) {
        edits.push(imp.replace(''));
      }
      continue;
    }

    // Handle inline type specifiers: `import { type X, Y } from '...'`
    const namedImports = imp.find({ rule: { kind: 'named_imports' } });
    if (!namedImports) continue;

    const specifiers = namedImports.findAll({ rule: { kind: 'import_specifier' } });
    const keptSpecifiers: string[] = [];
    let hasChanges = false;

    for (const specifier of specifiers) {
      const specText = specifier.text().trim();
      if (!specText.startsWith('type ')) {
        keptSpecifiers.push(specText);
        continue;
      }

      const localName = (specifier.field('alias') ?? specifier.field('name'))?.text();

      if (localName && !areAnyNamesUsed([localName], nonImportRoot, lang)) {
        hasChanges = true;
      } else {
        keptSpecifiers.push(specText);
      }
    }

    if (!hasChanges) continue;

    if (keptSpecifiers.length === 0) {
      const importClause = imp.children().find((c) => c.kind() === 'import_clause');
      const defaultId = importClause?.children().find((c) => c.kind() === 'identifier');

      if (defaultId) {
        const sourceField = imp.field('source');
        if (sourceField) {
          edits.push(imp.replace(`import ${defaultId.text()} from ${sourceField.text()};`));
        }
      } else {
        edits.push(imp.replace(''));
      }
    } else {
      edits.push(namedImports.replace(`{ ${keptSpecifiers.join(', ')} }`));
    }
  }

  return edits.length > 0 ? root.commitEdits(edits) : source;
}

function addTypeImport(source: string, lang: Lang, typeName: string, importPath: string): string {
  const ast = parse(lang, source);
  const root = ast.root();
  const typeImportLine = `import type { ${typeName} } from '${importPath}';`;

  const importNodes = root.findAll({ rule: { kind: 'import_statement' } });
  if (importNodes.length > 0) {
    const lastImport = importNodes[importNodes.length - 1];
    type Edit = ReturnType<SgNode['replace']>;
    const edits: Edit[] = [lastImport.replace(lastImport.text() + '\n' + typeImportLine)];
    return root.commitEdits(edits);
  }

  return typeImportLine + '\n' + source;
}

function cleanupResourceModelSource(
  source: string,
  lang: Lang,
  options?: TransformOptions,
  typeDeclarationNames?: ReadonlySet<string>
): string {
  const ast = parse(lang, source);
  const root = ast.root();

  type Edit = ReturnType<SgNode['replace']>;
  const edits: Edit[] = [];

  const defaultExport = findDefaultExport(root, options);
  if (defaultExport) {
    edits.push(defaultExport.replace(''));
  }

  const modelSources = getModelImportSources(options);
  const importStatements = root.findAll({ rule: { kind: 'import_statement' } });
  for (const importNode of importStatements) {
    const sourceField = importNode.field('source');
    if (!sourceField) continue;
    const importPath = removeQuotes(sourceField.text());
    if (modelSources.includes(importPath)) {
      edits.push(importNode.replace(''));
    }
  }

  if (typeDeclarationNames && typeDeclarationNames.size > 0) {
    for (const node of root.findAll({
      rule: { any: [{ kind: 'type_alias_declaration' }, { kind: 'interface_declaration' }] },
    })) {
      const nameNode = node.field('name');
      if (nameNode && typeDeclarationNames.has(nameNode.text())) {
        const parent = node.parent();
        if (parent && parent.kind() === 'export_statement') {
          edits.push(parent.replace(''));
        } else {
          edits.push(node.replace(''));
        }
      }
    }
  }

  return edits.length > 0 ? root.commitEdits(edits) : source;
}

/**
 * Extension artifact context - determines where the extension file is placed
 */
export type ExtensionContext = 'resource' | 'trait';

/**
 * Get the artifact type for an extension based on its context
 */
export function getExtensionArtifactType(context: ArtifactConfig): string {
  return context.type === 'trait' ? 'trait-extension' : 'resource-extension';
}

export function generateRegistrationBlock(name: string, featuresIdentifier: string): string {
  return `const Registration = {\n  kind: 'object',\n  name: '${name}',\n  features: ${featuresIdentifier},\n};\nexport default Registration;`;
}

/**
 * Generate extension code in either object or class format
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export function generateExtensionCode(
  config: ArtifactConfig,
  extensionProperties: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
  format: 'object' | 'class' = 'object',
  interfaceImportPath?: string,
  extendsClause?: string
): string {
  // Traits only export fieldsInterface (e.g. TimestampableTrait),
  // resources export the full type (e.g. User via WithLegacy<UserResource>)
  const typeToExtend = config.type === 'trait' ? config.identifiers.fieldsInterface : config.identifiers.type;

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
    const registrationBlock = generateRegistrationBlock(config.name, config.identifiers.extension!);

    // Add interface extension for TypeScript files or JSDoc for JavaScript files
    if (config.extensionIsTyped && typeToExtend) {
      const importStatement = interfaceImportPath
        ? `import type { ${typeToExtend} } from '${interfaceImportPath}';\n\n`
        : '';
      const interfaceExtends = extendsClause ? `${typeToExtend}, ${extendsClause}` : typeToExtend;
      return `${importStatement}export interface ${config.identifiers.extension} extends ${interfaceExtends} {}\n\n${classCode}\n\n${registrationBlock}`;
    }

    // For JavaScript files, don't add JSDoc import here since it's handled by the base class pattern
    return `${classCode}\n\n${registrationBlock}`;
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
  const registrationBlock = generateRegistrationBlock(config.name, config.identifiers.extension!);
  const migrationNote = `// TODO: migrate this extension to a class so that TypeScript declaration merging works.\n// Object extensions do not support interface merging.\n`;

  if (config.extensionIsTyped && typeToExtend) {
    const importStatement = interfaceImportPath
      ? `import type { ${typeToExtend} } from '${interfaceImportPath}';\n\n`
      : '';
    return `${importStatement}export interface ${config.identifiers.extension} extends ${typeToExtend} {}\n\n${migrationNote}${objectCode}\n\n${registrationBlock}`;
  }

  return `${migrationNote}${objectCode}\n\n${registrationBlock}`;
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
  schemaConfig: ArtifactConfig,
  filePath: string,
  source: string,
  extensionProperties: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
  options?: TransformOptions,
  interfaceImportPath?: string,
  sourceType: 'mixin' | 'model' | 'resource' = 'model',
  processImports?: (source: string, filePath: string, baseDir: string, options?: TransformOptions) => string,
  heritageLocalNames?: string[],
  typeDeclarationNames?: ReadonlySet<string>
): TransformArtifact | null {
  if (extensionProperties.length === 0) {
    return null;
  }

  try {
    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    log.debug(`Creating extension from ${filePath} with ${extensionProperties.length} properties`);

    const extFileName = `${schemaConfig.name}.ext${schemaConfig.extensionIsTyped ? '.ts' : getFileExtension(filePath)}`;

    const targetDir =
      schemaConfig.type === 'trait'
        ? options?.traitsDir || DEFAULT_TRAITS_DIR
        : options?.resourcesDir || DEFAULT_RESOURCES_DIR;
    const targetFilePath = join(resolve(targetDir), extFileName);

    // Update relative imports for the new extension location
    let updatedSource = updateRelativeImportsForExtensions(source, root, options, filePath, targetFilePath);
    log.debug(`Updated relative imports in source`);

    // For resource models, remove the original class declaration, model imports,
    // and type/interface declarations that were collected for the type file
    if (sourceType === 'resource') {
      updatedSource = cleanupResourceModelSource(updatedSource, lang, options, typeDeclarationNames);
    }

    // For mixins, remove the default export (Mixin.create block)
    if (sourceType === 'mixin') {
      const mixinAst = parse(lang, updatedSource);
      const mixinRoot = mixinAst.root();
      const defaultExport = findDefaultExport(mixinRoot, options);
      if (defaultExport) {
        updatedSource = mixinRoot.commitEdits([defaultExport.replace('')]);
      }
    }

    // Determine format based on source type: mixins use object format, models use class format
    const format = sourceType === 'mixin' ? 'object' : 'class';

    log.debug(`Extension generation for ${sourceType} using ${format} format`);

    const extendsClause = heritageLocalNames?.length ? heritageLocalNames.join(', ') : undefined;
    // For resource models, don't include the type import in the generated code (it's added separately at the top)
    const extInterfaceImportPath = sourceType === 'resource' ? undefined : interfaceImportPath;
    let extensionCode = generateExtensionCode(
      schemaConfig,
      extensionProperties,
      format,
      extInterfaceImportPath,
      extendsClause
    );

    // For resource models with typed extensions, add ts-ignore comment before the interface
    // and remove blank line between interface and class
    if (sourceType === 'resource' && schemaConfig.extensionIsTyped && schemaConfig.identifiers.type) {
      extensionCode = extensionCode.replace(
        `export interface ${schemaConfig.identifiers.extension}`,
        `// @ts-ignore-error in reality fields are not merged, they are overridden\nexport interface ${schemaConfig.identifiers.extension}`
      );
      extensionCode = extensionCode.replace(/\{}\n\n(export class)/, '{}\n$1');
    }

    let modifiedSource = updatedSource;

    // Process imports to resolve relative imports to absolute imports
    const baseDir = process.cwd();
    log.debug(`Processing imports for extension file: ${filePath}`);
    if (processImports) {
      modifiedSource = processImports(modifiedSource, filePath, baseDir, options);
    }

    // Remove fragment imports only from intermediate model extensions (not mixin or resource extensions)
    if (sourceType === 'model') {
      modifiedSource = removeUnnecessaryImports(modifiedSource, options);
    }

    // Clean up extra whitespace and add the extension code
    const trimmed = modifiedSource.trim();
    const separator = trimmed.endsWith('*/') ? '\n' : '\n\n';
    modifiedSource = trimmed + separator + extensionCode;

    // Remove unused type imports AFTER appending extension code so that types
    // referenced in the extension (e.g. IntlService, RouterService) are seen as used.
    if (sourceType === 'resource') {
      modifiedSource = removeUnusedTypeImports(modifiedSource, lang);
    }

    // For mixins, remove imports that are no longer used after removing the default export
    if (sourceType === 'mixin') {
      modifiedSource = removeUnusedImports(modifiedSource, lang);
    }

    // For resource models, add type import at the top
    if (sourceType === 'resource') {
      if (schemaConfig.extensionIsTyped && schemaConfig.identifiers.type) {
        const useTypeFile = !options?.combineSchemasAndTypes && schemaConfig.hasTypes;
        const typeSuffix = useTypeFile ? 'type' : 'schema';
        const typeImportPath = `./${schemaConfig.name}.${typeSuffix}${schemaConfig.extensionIsTyped ? '.ts' : getFileExtension(filePath)}`;
        modifiedSource = addTypeImport(modifiedSource, lang, schemaConfig.identifiers.type, typeImportPath);
      }
      // Collapse blank lines between consecutive import statements
      modifiedSource = modifiedSource.replace(/(import [^\n]+;)\n\n+(import )/g, '$1\n$2');
    }

    // Clean up any stray export keywords
    modifiedSource = modifiedSource.replace(EXPORT_DEFAULT_LINE_END_REGEX, '');
    modifiedSource = modifiedSource.replace(EXPORT_LINE_END_REGEX, '');

    log.debug(`Generated extension code (first 200 chars): ${modifiedSource.substring(0, 200)}...`);

    return {
      baseName: schemaConfig.name,
      type: getExtensionArtifactType(schemaConfig),
      name: schemaConfig.identifiers.extension!,
      code: modifiedSource,
      suggestedFileName: extFileName,
    };
  } catch (error) {
    log.error(`❌ Error creating extension for '${filePath}': ${String(error)}`);
    return null;
  }
}
