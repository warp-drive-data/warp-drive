import type { SgNode } from '@ast-grep/napi';
import { parse } from '@ast-grep/napi';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { logger } from '../../../utils/logger.js';
import type { TransformOptions } from '../config.js';
import type { SchemaArtifactRegistry } from './artifact.js';
import {
  deriveResourceExtensionName,
  deriveTraitExtensionName,
  deriveTraitInterfaceName,
  findEntityByBaseName,
  isConnectedToModel,
} from './artifact.js';
import { findClassDeclaration, findDefaultExport } from './ast-helpers.js';
import {
  extractBaseName,
  getImportSourceConfig,
  getLanguageFromPath,
  getPathSuffix,
  mixinNameToTraitName,
  removeQuotes,
  resolveRelativeImport,
  toPascalCase,
} from './path-utils.js';
import {
  EXT_FILE_PATH_REGEX,
  FILE_EXTENSION_REGEX,
  IMPORT_DEFAULT_REGEX,
  IMPORT_PATH_SINGLE_QUOTE_REGEX,
  IMPORT_TYPE_DEFAULT_REGEX,
  SCHEMA_PATH_REGEX,
} from './string.js';

const log = logger.for('import-utils');

/**
 * Default import sources for common Ember patterns
 */
export const DEFAULT_EMBER_DATA_SOURCE = '@ember-data/model';
export const DEFAULT_MIXIN_SOURCE = '@ember/object/mixin';
export const WARP_DRIVE_MODEL = '@warp-drive/model';
export const FRAGMENT_DECORATOR_SOURCE = 'ember-data-model-fragments/attributes';
export const FRAGMENT_BASE_SOURCE = 'ember-data-model-fragments/fragment';

export function getModelImportSources(options?: TransformOptions): string[] {
  return [
    options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    ...(options?.importSubstitutes?.map((s) => s.import) ?? []),
    WARP_DRIVE_MODEL,
    FRAGMENT_DECORATOR_SOURCE,
    FRAGMENT_BASE_SOURCE,
  ].filter(Boolean);
}

/**
 * Transform @warp-drive imports to use @warp-drive-mirror when mirror flag is set
 */
export function transformWarpDriveImport(importPath: string, options?: TransformOptions): string {
  if (options?.mirror && importPath.startsWith('@warp-drive')) {
    return importPath.replace('@warp-drive', '@warp-drive-mirror');
  }
  return importPath;
}

/**
 * Generate a type import statement for WarpDrive types
 */
export function generateWarpDriveTypeImport(
  typeName: string,
  importPath: string,
  options?: TransformOptions,
  includeImportKeyword = false
): string {
  const transformedPath = transformWarpDriveImport(importPath, options);
  const prefix = includeImportKeyword ? 'import ' : '';
  return `${prefix}type { ${typeName} } from '${transformedPath}'${includeImportKeyword ? ';' : ''}`;
}

/**
 * Build the import path for a trait file, respecting `combineSchemasAndTypes`.
 *
 * When `hasTypes` is `false` the trait never produced a `.type` file,
 * so the suffix is always `.schema` regardless of config.
 */
export function resolveTraitImportPath(baseName: string, options?: TransformOptions, hasTypes = true): string {
  const suffix = !options?.combineSchemasAndTypes && hasTypes ? 'type' : 'schema';
  const base = options?.traitsImport ?? '../traits';
  return `${base}/${baseName}.${suffix}`;
}

/**
 * Generate a trait type import statement
 * e.g., generateTraitImport('shareable', options) returns:
 *   "type { ShareableTrait } from '../traits/shareable.type'"
 */
export function generateTraitImport(traitName: string, options?: TransformOptions): string {
  const traitTypeName = deriveTraitInterfaceName(traitName);
  return `type { ${traitTypeName} } from '${resolveTraitImportPath(traitName, options)}'`;
}

/**
 * Get the configured model import source (required - no default provided)
 */
export function getModelImportSource(options?: TransformOptions): string {
  if (!options?.modelImportSource) {
    throw new Error('modelImportSource is required but not provided in configuration');
  }
  return options.modelImportSource;
}

/**
 * Get the configured resources import source (required - no default provided)
 */
export function getResourcesImport(options: TransformOptions): string {
  if (!options?.resourcesImport) {
    return '.';
  }
  return options.resourcesImport;
}

/**
 * Check if a type should be imported from traits instead of resources
 * This checks if the type corresponds to a connected mixin or intermediate model
 */
function shouldImportFromTraits(
  relatedType: string,
  options: TransformOptions,
  registry: SchemaArtifactRegistry
): boolean {
  // Check if a connected mixin corresponds to this related type via the entity registry
  const mixinEntity = findEntityByBaseName(registry, relatedType, 'mixin');
  if (mixinEntity && isConnectedToModel(registry, mixinEntity.path)) {
    return true;
  }

  // Check if any intermediate models correspond to this related type
  const intermediateEntity = findEntityByBaseName(registry, relatedType, 'intermediate-model');
  if (intermediateEntity) {
    return true;
  }

  if (options.importSubstitutes) {
    for (const sub of options.importSubstitutes) {
      if (sub.sourcePath && sub.trait === relatedType) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Transform a model type name to the appropriate import path
 * Priority order:
 * 1. Traits (for intermediate models/connected mixins)
 * 2. Resources (schema fallback)
 *
 * e.g., 'user' becomes 'my-app/data/resources/user.schema'
 * e.g., 'shareable' becomes 'my-app/data/traits/shareable.schema' if only shareable mixin exists
 */
export function transformModelToResourceImport(
  relatedType: string,
  modelName: string,
  options: TransformOptions,
  registry: SchemaArtifactRegistry
): string {
  // Determine whether this type should be imported from a trait file
  const modelEntity = findEntityByBaseName(registry, relatedType, 'model');
  const mixinEntity = findEntityByBaseName(registry, relatedType, 'mixin');
  const useTrait = shouldImportFromTraits(relatedType, options, registry) || (!modelEntity && !!mixinEntity);

  if (useTrait) {
    if (!modelEntity && mixinEntity) {
      log.debug(`No model found for ${relatedType}, falling back to trait`);
    }
    const traitName = deriveTraitInterfaceName(relatedType);
    const aliasName = toPascalCase(relatedType);
    const path = resolveTraitImportPath(relatedType, options);
    return `type { ${traitName} as ${aliasName} } from '${path}'`;
  }

  // Default to resource import
  const resourcesImport = getResourcesImport(options);
  const ext = options.projectImportsUseExtensions ? '.ts' : '';

  let useTypeFile = false;
  if (!options.combineSchemasAndTypes) {
    const isTargetTyped = modelEntity ? modelEntity.parsedFile.isTypeScript : false;
    useTypeFile = isTargetTyped || !options.disableMissingTypeAutoGen;
  }

  const typeFileName = useTypeFile ? `${relatedType}.type${ext}` : `${relatedType}.schema${ext}`;

  return `type { ${modelName} } from '${resourcesImport}/${typeFileName}'`;
}

/**
 * Type of import source for resolving absolute imports
 */
type ImportSourceType = 'model' | 'mixin';

/**
 * Check if an import path matches configured sources for a given source type
 * Generic implementation for both model and mixin import path checking
 */
function isImportPathOfType(importPath: string, sourceType: ImportSourceType, options?: TransformOptions): boolean {
  const config = getImportSourceConfig(sourceType, options);

  log.debug(`Checking if import path is ${sourceType}: ${importPath}`);
  log.debug(`Primary source: ${config.primarySource}`);
  log.debug(`Additional sources: ${JSON.stringify(config.additionalSources)}`);

  // Check against configured primary source
  if (
    config.primarySource &&
    (importPath === config.primarySource || importPath.startsWith(config.primarySource + '/'))
  ) {
    log.debug(`Matched configured ${sourceType} import source: ${config.primarySource}`);
    return true;
  }

  // Check against additional sources from configuration
  if (config.additionalSources && Array.isArray(config.additionalSources)) {
    const matched = config.additionalSources.some((source) => {
      const prefix = source.pattern.endsWith('/') ? source.pattern : source.pattern + '/';
      const matches = importPath === source.pattern || importPath.startsWith(prefix);
      log.debug(`Checking pattern ${source.pattern}: ${matches}`);
      return matches;
    });
    if (matched) {
      log.debug(`Matched additional ${sourceType} source`);
      return true;
    }
  }

  log.debug(`No ${sourceType} source match found`);
  return false;
}

/**
 * Check if an import path points to a model file based on configuration
 */
export function isModelImportPath(importPath: string, options?: TransformOptions): boolean {
  return isImportPathOfType(importPath, 'model', options);
}

/**
 * Check if an import path points to a mixin file based on configuration
 */
export function isMixinImportPath(importPath: string, options?: TransformOptions): boolean {
  return isImportPathOfType(importPath, 'mixin', options);
}

/**
 * Check if an import path is a special mixin import (e.g., workflowable from models)
 */
export function isSpecialMixinImport(importPath: string, options?: TransformOptions): boolean {
  // Special case: workflowable is imported from models but is actually a mixin
  // Use the configured modelImportSource to detect this pattern
  const modelImportSource = options?.modelImportSource;
  if (modelImportSource && importPath === `${modelImportSource}/workflowable`) {
    return true;
  }

  // Add other special cases here as needed
  return false;
}

/**
 * Resolve a special mixin import path to a file system path
 */
function resolveSpecialMixinImport(importPath: string, baseDir: string, options?: TransformOptions): string | null {
  try {
    // Special case: workflowable from models -> mixins/workflowable
    // Use the configured modelImportSource and mixinSourceDir to resolve
    const modelImportSource = options?.modelImportSource;
    if (modelImportSource && importPath === `${modelImportSource}/workflowable`) {
      // Use the configured mixin source directory, or fall back to deriving from the app import prefix
      const mixinSourceDir = options?.mixinSourceDir;
      if (mixinSourceDir) {
        const mixinPath = `${mixinSourceDir}/workflowable.js`;
        log.debug(`Resolved special mixin import ${importPath} to: ${mixinPath}`);
        return mixinPath;
      }
      // Fallback: try to infer from baseDir
      const mixinPath = `${baseDir}/app/mixins/workflowable.js`;
      log.debug(`Resolved special mixin import ${importPath} to: ${mixinPath}`);
      return mixinPath;
    }

    // Add other special cases here as needed
    return null;
  } catch (error) {
    log.debug(`Error resolving special mixin import: ${String(error)}`);
    return null;
  }
}

/**
 * Resolve an absolute import path to a file system path
 * Generic implementation for both model and mixin imports
 */
function resolveAbsoluteImport(
  importPath: string,
  sourceType: ImportSourceType,
  options?: TransformOptions
): string | null {
  try {
    log.debug(`Resolving absolute ${sourceType} import: ${importPath}`);

    // Get configuration for this source type
    const config = getImportSourceConfig(sourceType, options);

    // Build sources array from configuration
    const sources: Array<{ pattern: string; dir: string }> = [];

    // Add primary source if configured
    if (config.primarySource && config.primaryDir) {
      sources.push({ pattern: config.primarySource + '/', dir: config.primaryDir });
    }

    // Add additional sources from configuration
    if (config.additionalSources && Array.isArray(config.additionalSources)) {
      sources.push(...config.additionalSources);
    }

    log.debug(`${sourceType} sources: ${JSON.stringify(sources)}`);

    // Find matching source (boundary-safe check)
    const matchedSource = sources.find((source) => {
      const prefix = source.pattern.endsWith('/') ? source.pattern : source.pattern + '/';
      return importPath === source.pattern || importPath.startsWith(prefix);
    });
    if (!matchedSource) {
      log.debug(`No matching ${sourceType} source found for import: ${importPath}`);
      return null;
    }

    log.debug(`Found matching ${sourceType} source: ${JSON.stringify(matchedSource)}`);

    // Extract the name from the import path
    // e.g., 'my-app/models/notification-message' -> 'notification-message'
    const name = importPath.replace(matchedSource.pattern, '');
    log.debug(`Extracted ${sourceType} name: ${name}`);

    // Try .ts extension first (source.dir is already an absolute path)
    const tsFilePath = `${matchedSource.dir}/${name}.ts`;
    log.debug(`Trying file path: ${tsFilePath}`);

    if (existsSync(tsFilePath)) {
      log.debug(`Found ${sourceType} file: ${tsFilePath}`);
      return tsFilePath;
    }

    // Try .js extension
    const jsFilePath = `${matchedSource.dir}/${name}.js`;
    log.debug(`Trying JS file path: ${jsFilePath}`);

    if (existsSync(jsFilePath)) {
      log.debug(`Found ${sourceType} file: ${jsFilePath}`);
      return jsFilePath;
    }

    log.debug(`${sourceType} file not found for import: ${importPath} (tried ${tsFilePath} and ${jsFilePath})`);
    return null;
  } catch (error) {
    log.debug(`Error resolving absolute ${sourceType} import: ${String(error)}`);
    return null;
  }
}

/**
 * Resolve an absolute mixin import path to a file system path
 */
function resolveAbsoluteMixinImport(importPath: string, baseDir: string, options?: TransformOptions): string | null {
  return resolveAbsoluteImport(importPath, 'mixin', options);
}

/**
 * Resolve an absolute model import path to a file system path
 */
function resolveAbsoluteModelImport(importPath: string, baseDir: string, options?: TransformOptions): string | null {
  return resolveAbsoluteImport(importPath, 'model', options);
}

/**
 * Check if a file is a mixin file by analyzing its content
 */
export function isMixinFile(filePath: string, options?: TransformOptions): boolean {
  try {
    const source = readFileSync(filePath, 'utf8');

    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    // Look for Mixin.create patterns or mixin imports
    const mixinSources = ['@ember/object/mixin'];

    if (findEmberImportLocalName) {
      const mixinImportLocal = findEmberImportLocalName(root, mixinSources, options);
      return !!mixinImportLocal;
    }

    // Fallback: simple check for mixin import
    const importStatements = root.findAll({ rule: { kind: 'import_statement' } });
    for (const importNode of importStatements) {
      const sourceField = importNode.field('source');
      if (sourceField && mixinSources.includes(removeQuotes(sourceField.text()))) {
        return true;
      }
    }

    return false;
  } catch (error) {
    log.debug(`Error checking if file is mixin: ${String(error)}`);
    return false;
  }
}

/**
 * Check if a resolved path matches any of the given intermediate paths
 * using additional model sources for path mapping
 */
function matchesIntermediatePath(
  resolvedPath: string,
  intermediatePaths: string[] | undefined,
  additionalModelSources: Array<{ pattern: string; dir: string }> | undefined,
  options?: TransformOptions
): boolean {
  if (!intermediatePaths || !additionalModelSources) {
    return false;
  }

  for (const intermediatePath of intermediatePaths) {
    for (const { pattern, dir } of additionalModelSources) {
      if (intermediatePath.startsWith(pattern.replace('/*', ''))) {
        // Convert intermediate path to file path using the mapping
        const relativePart = intermediatePath.replace(pattern.replace('/*', ''), '');
        const expectedFilePath = dir.replace('/*', relativePart);

        // Check both .ts and .js extensions
        const possiblePaths = [`${expectedFilePath}.ts`, `${expectedFilePath}.js`];
        // The resolvedPath might already have an extension, or might not
        const pathMatches = possiblePaths.some((p) => {
          // Check if resolvedPath matches exactly
          if (resolvedPath === p) return true;
          // Check if resolvedPath without extension matches
          if (`${resolvedPath}.ts` === p || `${resolvedPath}.js` === p) return true;
          return false;
        });

        if (pathMatches) {
          log.debug(`Found match: resolved path ${resolvedPath} matches intermediate path ${intermediatePath}`);
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a file is a model file by analyzing its content
 */
export function isModelFile(filePath: string, source: string, options?: TransformOptions): boolean {
  try {
    // Special case: if this file itself is listed as an intermediate model or fragment, it's a model by definition
    if (options?.intermediateModelPaths) {
      const filePathWithoutExt = filePath.replace(FILE_EXTENSION_REGEX, '');
      for (const intermediatePath of options.intermediateModelPaths) {
        const pathSuffix = getPathSuffix(intermediatePath, 2); // e.g., "core/base-model"
        if (filePathWithoutExt.endsWith(pathSuffix)) {
          return true;
        }
      }
    }
    if (options?.intermediateFragmentPaths) {
      const filePathWithoutExt = filePath.replace(FILE_EXTENSION_REGEX, '');
      for (const intermediatePath of options.intermediateFragmentPaths) {
        const pathSuffix = getPathSuffix(intermediatePath, 2); // e.g., "fragments/base-fragment"
        if (filePathWithoutExt.endsWith(pathSuffix)) {
          return true;
        }
      }
    }

    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    // Look for a default export that extends a model
    const defaultExportNode = findDefaultExport(root, options);
    if (!defaultExportNode) {
      return false;
    }

    // Use shared findClassDeclaration to find the class either in export or by reference
    const classDeclaration = findClassDeclaration(defaultExportNode, root, options);

    if (!classDeclaration) {
      return false;
    }

    // Check if it has a heritage clause (extends)
    const heritageClause = classDeclaration.find({ rule: { kind: 'class_heritage' } });
    if (!heritageClause) {
      return false;
    }

    // Parse the heritage clause to find what this class actually extends
    const identifiers = heritageClause.findAll({ rule: { kind: 'identifier' } });
    const extendedClasses = identifiers.map((id) => id.text());

    log.debug(`Class extends: ${extendedClasses.join(', ')}`);

    // Use emberDataImportSource to determine what classes are base models
    const baseModelSources = [];
    if (options?.emberDataImportSource) {
      baseModelSources.push(options.emberDataImportSource);
    }
    if (options?.importSubstitutes) {
      baseModelSources.push(...options.importSubstitutes.map((s) => s.import));
    }
    // Add default EmberData sources
    baseModelSources.push('@ember-data/model', '@warp-drive/model', '@auditboard/warp-drive/v1/model');
    // Add Fragment base class support
    baseModelSources.push('ember-data-model-fragments/fragment');
    if (options?.intermediateModelPaths) {
      baseModelSources.push(...options.intermediateModelPaths);
    }
    if (options?.intermediateFragmentPaths) {
      baseModelSources.push(...options.intermediateFragmentPaths);
    }

    if (baseModelSources.length === 0) {
      log.debug(`No base model sources provided, cannot determine if this is a model`);
      return false;
    }

    // Extract imported class names from base model sources by looking at actual imports
    const expectedBaseModels: string[] = [];
    const importStatements = root.findAll({ rule: { kind: 'import_statement' } });

    for (const importNode of importStatements) {
      const importSource = importNode.field('source');
      if (!importSource) continue;

      const sourceText = removeQuotes(importSource.text());

      // Check for direct matches with base model sources
      let isBaseModelImport = baseModelSources.includes(sourceText);

      // If not a direct match, check if it's a relative import that resolves to an intermediate model or fragment
      if (
        !isBaseModelImport &&
        sourceText.startsWith('.') &&
        (options?.intermediateModelPaths || options?.intermediateFragmentPaths)
      ) {
        try {
          // Resolve relative path to absolute path
          const resolvedPath = resolve(dirname(filePath), sourceText);
          log.debug(`Checking relative import ${sourceText} -> ${resolvedPath}`);

          // Check if this resolved path corresponds to any intermediate model or fragment
          if (
            matchesIntermediatePath(
              resolvedPath,
              options.intermediateModelPaths,
              options.additionalModelSources,
              options
            ) ||
            matchesIntermediatePath(
              resolvedPath,
              options.intermediateFragmentPaths,
              options.additionalModelSources,
              options
            )
          ) {
            isBaseModelImport = true;
          }
        } catch (error: unknown) {
          // Ignore path resolution errors
          log.debug(`Failed to resolve relative path ${sourceText}: ${String(error)}`);
        }
      }

      if (isBaseModelImport) {
        // Get the import clause to find imported identifiers
        const importClause = importNode.children().find((child) => child.kind() === 'import_clause');
        if (!importClause) continue;

        // Check for default import - it's the first identifier child in the import clause
        const children = importClause.children();
        const firstChild = children[0];
        if (firstChild && firstChild.kind() === 'identifier') {
          expectedBaseModels.push(firstChild.text());
        }

        // Check for named imports (e.g., import { BaseModel } from 'some/path')
        const namedImports = importClause.findAll({ rule: { kind: 'named_imports' } });
        for (const namedImportNode of namedImports) {
          const importSpecifiers = namedImportNode.findAll({ rule: { kind: 'import_specifier' } });
          for (const specifier of importSpecifiers) {
            const nameNode = specifier.field('name');
            if (nameNode) {
              expectedBaseModels.push(nameNode.text());
            }
          }
        }
      }
    }

    log.debug(`Expected base models from imports: ${expectedBaseModels.join(', ')}`);
    log.debug(`Extended classes found: ${extendedClasses.join(', ')}`);
    log.debug(`Base model sources searched: ${baseModelSources.join(', ')}`);

    // Check if any of the extended classes match our expected base models
    const result = expectedBaseModels.some((baseModel) =>
      extendedClasses.some((extended) => extended.includes(baseModel))
    );
    log.debug(`Model detection result: ${result}`);
    return result;
  } catch (error) {
    log.debug(`Error checking if file is model: ${String(error)}`);
    return false;
  }
}

/**
 * Generic function to find Ember import local names (works for both Model and Mixin)
 * Now also handles relative imports that point to model files
 */
export function findEmberImportLocalName(
  root: SgNode,
  expectedSources: string[],
  options?: TransformOptions,
  fromFile?: string,
  baseDir?: string
): string | null {
  log.debug(`Looking for imports from sources:`, expectedSources);

  const importStatements = root.findAll({ rule: { kind: 'import_statement' } });

  for (const importNode of importStatements) {
    const source = importNode.field('source');
    if (!source) continue;

    const cleanSourceText = removeQuotes(source.text()).replace(FILE_EXTENSION_REGEX, '');

    // Check if this is a direct match with expected sources
    if (expectedSources.includes(cleanSourceText)) {
      const importClause = importNode.children().find((child) => child.kind() === 'import_clause');
      if (!importClause) {
        log.debug('No import clause found in children');
        continue;
      }

      const children = importClause.children();
      const firstChild = children[0];
      // Only return a local name if there's an actual default import (first child is identifier)
      if (firstChild && firstChild.kind() === 'identifier') {
        const localName = firstChild.text();
        return localName;
      }

      log.debug('No default import found (only named imports)');
    }

    // Check if this is a relative import that points to a model file
    if (fromFile && baseDir && (cleanSourceText.startsWith('./') || cleanSourceText.startsWith('../'))) {
      const resolvedPath = resolveRelativeImport(cleanSourceText, fromFile);
      if (resolvedPath) {
        try {
          const fileContent = readFileSync(resolvedPath, 'utf8');

          if (isModelFile(resolvedPath, fileContent, options)) {
            log.debug(`Found relative import pointing to model file: ${cleanSourceText} -> ${resolvedPath}`);

            const importClause = importNode.children().find((child) => child.kind() === 'import_clause');
            if (importClause) {
              // Only return a local name if there's an actual default import
              const children = importClause.children();
              const firstChild = children[0];
              if (firstChild && firstChild.kind() === 'identifier') {
                const localName = firstChild.text();
                log.debug(`Found relative model import with local name: ${localName}`);
                return localName;
              }
            }
          }
        } catch (error) {
          log.debug(`Error reading resolved file ${resolvedPath}: ${String(error)}`);
        }
      }
    }
  }

  log.debug(`No valid import found for sources: ${expectedSources.join(', ')}`);
  return null;
}

/**
 * Convert a resolved file path to an absolute import path
 */
function convertToAbsoluteImportPath(resolvedPath: string, baseDir: string, options?: TransformOptions): string | null {
  try {
    // Make the path relative to the base directory
    const relativePath = resolvedPath.replace(baseDir + '/', '');

    // Remove the file extension
    const pathWithoutExt = relativePath.replace(FILE_EXTENSION_REGEX, '');

    // Convert to import path format
    const importPath = pathWithoutExt.startsWith('apps/') ? pathWithoutExt.replace('apps/', '') : pathWithoutExt;

    log.debug(`Converted resolved path ${resolvedPath} to import path: ${importPath}`);
    return importPath;
  } catch (error) {
    log.debug(`Error converting to absolute import path: ${String(error)}`);
    return null;
  }
}

/**
 * Convert an import to the appropriate absolute import based on what type of file it points to
 */
function convertImportToAbsolute(
  originalImport: string,
  resolvedPath: string,
  baseDir: string,
  importNode: SgNode,
  isRelativeImport: boolean,
  options: TransformOptions,
  registry: SchemaArtifactRegistry
): string | null {
  try {
    // Check if the resolved file is a model file
    try {
      const source = readFileSync(resolvedPath, 'utf8');
      if (isModelFile(resolvedPath, source, options)) {
        // Convert model import to resource schema import
        const modelName = extractBaseName(resolvedPath);
        const pascalCaseName = toPascalCase(modelName);
        const resourceImport = transformModelToResourceImport(modelName, pascalCaseName, options, registry);

        // Extract just the import path from the full import statement
        const importPathMatch = resourceImport.match(IMPORT_PATH_SINGLE_QUOTE_REGEX);
        if (importPathMatch) {
          log.debug(`Converting model import ${originalImport} to resource import: ${importPathMatch[1]}`);
          return importPathMatch[1];
        }
      }
    } catch (fileError) {
      log.debug(`Error reading file ${resolvedPath}: ${String(fileError)}`);
    }

    // Check if this is a special mixin import
    if (isSpecialMixinImport(originalImport, options)) {
      // Convert special mixin import to trait import
      const mixinName = extractBaseName(resolvedPath);
      const traitName = mixinNameToTraitName(mixinName);
      const traitImport = options?.traitsImport
        ? `${options.traitsImport}/${traitName}.schema`
        : `../traits/${traitName}.schema`;

      log.debug(`Converting special mixin import ${originalImport} to trait import: ${traitImport}`);
      return traitImport;
    }

    // Check if the resolved file is a mixin file
    if (isMixinFile(resolvedPath, options)) {
      // Convert mixin import to trait import
      const mixinName = extractBaseName(resolvedPath);
      const traitName = mixinNameToTraitName(mixinName);
      const traitImport = options?.traitsImport
        ? `${options.traitsImport}/${traitName}.schema`
        : `../traits/${traitName}.schema`;

      log.debug(`Converting mixin import ${originalImport} to trait import: ${traitImport}`);
      return traitImport;
    }

    // For other files, convert to absolute import path
    const absoluteImportPath = convertToAbsoluteImportPath(resolvedPath, baseDir, options);
    return absoluteImportPath;
  } catch (error) {
    log.debug(`Error converting import: ${String(error)}`);
    return null;
  }
}

/**
 * Process imports in source code to resolve relative imports and convert them to appropriate types
 */
export function processImports(
  source: string,
  filePath: string,
  baseDir: string,
  options: TransformOptions,
  registry: SchemaArtifactRegistry
): string {
  try {
    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    // Find all import statements
    const importStatements = root.findAll({ rule: { kind: 'import_statement' } });

    let processedSource = source;

    for (const importNode of importStatements) {
      const sourceNode = importNode.field('source');
      if (!sourceNode) continue;

      const sourceText = sourceNode.text();
      const cleanSourceText = removeQuotes(sourceText);

      // Process both relative and absolute imports
      let resolvedPath: string | null = null;
      let isRelativeImport = false;

      // Skip processing if this is already a resource import (to avoid double-processing)
      if (options?.resourcesImport && cleanSourceText.startsWith(options.resourcesImport)) {
        log.debug(`Skipping already processed resource import: ${cleanSourceText}`);
        continue;
      }

      if (cleanSourceText.startsWith('./') || cleanSourceText.startsWith('../')) {
        // Handle relative imports
        log.debug(`Processing relative import: ${cleanSourceText}`);
        isRelativeImport = true;
        resolvedPath = resolveRelativeImport(cleanSourceText, filePath);
      } else if (isSpecialMixinImport(cleanSourceText, options)) {
        // Handle special cases where model imports are actually mixins (e.g., workflowable)
        log.debug(`Processing special mixin import: ${cleanSourceText}`);
        resolvedPath = resolveSpecialMixinImport(cleanSourceText, baseDir, options);
      } else if (isModelImportPath(cleanSourceText, options)) {
        // Handle absolute imports that point to model files
        log.debug(`Processing absolute model import: ${cleanSourceText}`);
        resolvedPath = resolveAbsoluteModelImport(cleanSourceText, baseDir, options);
      } else if (isMixinImportPath(cleanSourceText, options)) {
        // Handle absolute imports that point to mixin files
        log.debug(`Processing absolute mixin import: ${cleanSourceText}`);
        resolvedPath = resolveAbsoluteMixinImport(cleanSourceText, baseDir, options);
      }

      if (resolvedPath) {
        // Determine what type of import this should be converted to
        const convertedImport = convertImportToAbsolute(
          cleanSourceText,
          resolvedPath,
          baseDir,
          importNode,
          isRelativeImport,
          options,
          registry
        );

        if (convertedImport) {
          log.debug(`Converted import: ${cleanSourceText} -> ${convertedImport}`);

          // Replace the import with the converted import, always using single quotes
          const originalImport = importNode.text();
          let newImport = originalImport;

          // If the target is a .schema file, convert default imports to named imports
          // But only for TypeScript files (.ts), not JavaScript files (.js)
          if (convertedImport.includes('.schema') && filePath.endsWith('.ts')) {
            log.debug(`Found .schema import in TypeScript file, converting default to named: ${originalImport}`);

            // Check if this is a trait import (from traits/ directory)
            const isTraitImport = convertedImport.includes('/traits/');
            // Extract the trait/resource base name from the import path
            const pathMatch = convertedImport.match(SCHEMA_PATH_REGEX);
            const baseName = pathMatch ? pathMatch[2] : null;

            // Convert "import type ModelName from 'path'" to "import type { ModelName } from 'path'"
            // Handle Model suffix by creating aliased imports
            // Handle Trait imports by using the correct Trait suffix export name
            newImport = newImport.replace(IMPORT_TYPE_DEFAULT_REGEX, (_match: string, typeName: string) => {
              if (typeName.endsWith('Model')) {
                const interfaceName = typeName.slice(0, -5); // Remove 'Model' suffix
                return `import type { ${interfaceName} as ${typeName} } from`;
              }
              // For trait imports, the export is *Trait but the import name might not have Trait suffix
              if (isTraitImport && baseName && !typeName.endsWith('Trait')) {
                const traitClassName = deriveTraitInterfaceName(baseName);
                return `import type { ${traitClassName} as ${typeName} } from`;
              }
              return `import type { ${typeName} } from`;
            });
            // Reset regex lastIndex for reuse
            IMPORT_TYPE_DEFAULT_REGEX.lastIndex = 0;
            // Also handle imports without 'type' keyword
            newImport = newImport.replace(IMPORT_DEFAULT_REGEX, (_match: string, typeName: string) => {
              if (typeName.endsWith('Model')) {
                const interfaceName = typeName.slice(0, -5); // Remove 'Model' suffix
                return `import type { ${interfaceName} as ${typeName} } from`;
              }
              if (isTraitImport && baseName && !typeName.endsWith('Trait')) {
                const traitClassName = deriveTraitInterfaceName(baseName);
                return `import type { ${traitClassName} as ${typeName} } from`;
              }
              return `import type { ${typeName} } from`;
            });
            // Reset regex lastIndex for reuse
            IMPORT_DEFAULT_REGEX.lastIndex = 0;
            log.debug(`Converted default import to named import: ${newImport}`);
          } else if (convertedImport.includes('.schema') && filePath.endsWith('.js')) {
            log.debug(
              `Found .schema import in JavaScript file, skipping TypeScript syntax conversion: ${originalImport}`
            );
            // For JavaScript files, we should not use TypeScript import type syntax
            // The import should remain as a regular import, not converted to named import
          } else if (convertedImport.includes('.ext')) {
            // Extension files export named classes with 'Extension' suffix
            // The default export is now a Registration manifest, not the class itself
            log.debug(`Found extension import, converting default to named: ${originalImport}`);
            const extensionPathMatch = convertedImport.match(EXT_FILE_PATH_REGEX);
            const modelBaseName = extensionPathMatch ? extensionPathMatch[1] : null;
            const isTraitExtension = convertedImport.includes('/traits/');
            const extensionClassName = modelBaseName
              ? isTraitExtension
                ? deriveTraitExtensionName(modelBaseName)
                : deriveResourceExtensionName(modelBaseName)
              : null;

            if (extensionClassName) {
              const isTS = filePath.endsWith('.ts');
              // For TS files: "import type User from '.../user.ext'" -> "import type { UserExtension as User } from '.../user.ext'"
              // For JS files: "import User from '.../user.ext'" -> "import { UserExtension as User } from '.../user.ext'"
              newImport = newImport.replace(IMPORT_TYPE_DEFAULT_REGEX, (_match: string, typeName: string) => {
                return `import type { ${extensionClassName} as ${typeName} } from`;
              });
              IMPORT_TYPE_DEFAULT_REGEX.lastIndex = 0;
              newImport = newImport.replace(IMPORT_DEFAULT_REGEX, (_match: string, typeName: string) => {
                const keyword = isTS ? 'import type' : 'import';
                return `${keyword} { ${extensionClassName} as ${typeName} } from`;
              });
              IMPORT_DEFAULT_REGEX.lastIndex = 0;
              log.debug(`Converted extension import to named import: ${newImport}`);
            }
          } else {
            log.debug(`Not a .schema or .ext import, skipping conversion: ${convertedImport}`);
          }

          processedSource = processedSource.replace(originalImport, newImport);
        }
      }
    }

    return processedSource;
  } catch (error) {
    log.debug(`Error processing imports: ${String(error)}`);
    return source; // Return original source if processing fails
  }
}
