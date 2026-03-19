import { dirname, resolve } from 'path';

import type { InstanciatedLogger } from '../../../utils/logger.js';
import type { Codemod } from '../codemod.js';
import type { FinalOptions } from '../config.js';
import { extractBaseName } from '../utils/ast-utils.js';
import type { ParsedFile } from '../utils/file-parser.js';
import { getImportSourceConfig, resolveImportPath, resolveRelativeImport } from '../utils/path-utils.js';

/**
 * Check if a resolved path is within the mixin source directory
 */
function isInMixinSourceDir(resolvedPath: string | null, mixinSourceDir: string): boolean {
  return !!resolvedPath && resolvedPath.startsWith(mixinSourceDir);
}

export type connectedMixins = Set<string>;
export type modelToMixinsMap = Map<string, connectedMixins>;

export interface ModelMixinAnalysisResult {
  /** Set of all mixin file paths connected to models (directly or transitively) */
  connectedMixins: connectedMixins;
  /** Map of model file paths to the set of mixin file paths they use */
  modelToMixinsMap: modelToMixinsMap;
}

/**
 * Analyze which mixins are actually used by models (directly or transitively)
 * Returns both the set of connected mixins and a map of model -> mixin relationships
 * Uses pre-parsed ParsedFile data for all analysis
 */
export function analyzeModelMixinUsage(codemod: Codemod, options: FinalOptions): ModelMixinAnalysisResult {
  const modelMixins = new Set<string>();
  const mixinDependencies = new Map<string, Set<string>>();
  const mixinFiles = Array.from(codemod.input.parsedMixins.keys());

  // Track which mixins each model uses directly
  const modelToMixinsMap = new Map<string, Set<string>>();

  const logger = codemod.logger;
  logger.info(`🔍 Analyzing mixin usage relationships...`);

  // Analyze model files for direct mixin usage, polymorphic relationships, and type-only imports
  let modelsProcessed = 0;
  for (const [modelFile, parsedModel] of codemod.input.parsedModels) {
    const modelMixinsSet = new Set<string>();

    try {
      // Extract direct mixin imports from pre-parsed data
      const mixinsUsedByModel = extractMixinImportsFromParsed(parsedModel, modelFile, logger, options);

      modelsProcessed++;
      logger.debug(`📊 Analyzed ${modelsProcessed}/${codemod.input.parsedModels.size} models...`);

      for (const mixinPath of mixinsUsedByModel) {
        modelMixins.add(mixinPath);
        modelMixinsSet.add(mixinPath);
        logger.debug(`📋 Model ${modelFile} uses mixin ${mixinPath}`);
      }

      // Check for polymorphic relationships that reference mixins using parsed fields
      const polymorphicMixins = extractPolymorphicMixinReferences(parsedModel, mixinFiles, logger);
      if (polymorphicMixins.length > 0) {
        logger.debug(`🔍 Found ${polymorphicMixins.length} polymorphic mixin references in ${modelFile}`);
      }
      for (const mixinPath of polymorphicMixins) {
        modelMixins.add(mixinPath);
        modelMixinsSet.add(mixinPath);
        logger.info(`📋 Model ${modelFile} has polymorphic relationship to mixin ${mixinPath}`);
      }

      // Check for type-only mixin imports using parsed imports
      const typeOnlyMixins = extractTypeOnlyMixinReferences(parsedModel, mixinFiles, logger, options);
      for (const mixinPath of typeOnlyMixins) {
        modelMixins.add(mixinPath);
        modelMixinsSet.add(mixinPath);
        logger.debug(`📋 Model ${modelFile} has type-only reference to mixin ${mixinPath}`);
      }

      if (
        options.verbose &&
        mixinsUsedByModel.length === 0 &&
        polymorphicMixins.length === 0 &&
        typeOnlyMixins.length === 0
      ) {
        logger.info(`📋 Model ${modelFile} uses no mixins`);
      }
    } catch (error) {
      logger.error(`❌ Error analyzing model ${modelFile}: ${String(error)}`);
    }

    // Store the mixins used by this model
    if (modelMixinsSet.size > 0) {
      modelToMixinsMap.set(modelFile, modelMixinsSet);
    }
  }

  // Analyze mixin files for their dependencies on other mixins
  for (const [mixinFile, parsedMixin] of codemod.input.parsedMixins) {
    try {
      const mixinsUsedByMixin = extractMixinImportsFromParsed(parsedMixin, mixinFile, logger, options);
      mixinDependencies.set(mixinFile, new Set(mixinsUsedByMixin));

      if (options.verbose && mixinsUsedByMixin.length > 0) {
        logger.info(`📋 Mixin ${mixinFile} uses mixins: ${mixinsUsedByMixin.join(', ')}`);
      }
    } catch (error) {
      if (options.verbose) {
        logger.error(`❌ Error analyzing mixin ${mixinFile}: ${String(error)}`);
      }
    }
  }

  // Transitively find all mixins that are connected to models
  const transitiveModelMixins = new Set(modelMixins);
  let changed = true;

  while (changed) {
    changed = false;
    for (const [mixinFile, dependencies] of mixinDependencies) {
      if (transitiveModelMixins.has(mixinFile)) {
        // This mixin is connected to models, so all its dependencies are too
        for (const dep of dependencies) {
          if (!transitiveModelMixins.has(dep)) {
            transitiveModelMixins.add(dep);
            changed = true;
            if (options.verbose) {
              logger.info(`📋 Mixin ${dep} is transitively connected to models via ${mixinFile}`);
            }
          }
        }
      }
    }
  }

  if (options.verbose) {
    logger.info(
      `✅ Found ${transitiveModelMixins.size} mixins connected to models (${modelMixins.size} direct, ${transitiveModelMixins.size - modelMixins.size} transitive)`
    );
    logger.info(`📋 Model-connected mixins:`);
    for (const mixinPath of transitiveModelMixins) {
      logger.info(`   - ${mixinPath}`);
    }
    logger.info(`📋 Model -> Mixins mapping:`);
    for (const [modelFile, mixins] of modelToMixinsMap) {
      logger.info(`   - ${modelFile}: ${[...mixins].join(', ')}`);
    }
  }

  return { connectedMixins: transitiveModelMixins, modelToMixinsMap };
}

/**
 * Extract mixin import paths from pre-parsed file data
 * Uses ParsedFile.imports to resolve which imports point to mixin files
 */
function extractMixinImportsFromParsed(
  parsedFile: ParsedFile,
  filePath: string,
  logger: InstanciatedLogger,
  finalOptions: FinalOptions
): string[] {
  const mixinPaths: string[] = [];

  try {
    logger.debug(
      `[DEBUG] extractMixinImportsFromParsed for ${filePath}: found ${parsedFile.imports.length} imports from parsed data`
    );

    // Check all imports to see if they resolve to mixin files
    for (const importInfo of parsedFile.imports) {
      const resolved = resolveMixinPath(importInfo.path, filePath, logger, finalOptions);
      if (resolved) {
        mixinPaths.push(resolved);
      }
    }

    return [...new Set(mixinPaths)];
  } catch (error) {
    logger.debug(`Error extracting mixin imports from parsed data for ${filePath}: ${String(error)}`);
    return [];
  }
}

/**
 * Resolve a mixin import path to an absolute file path
 */
function resolveMixinPath(
  importPath: string,
  currentFilePath: string,
  logger: InstanciatedLogger,
  options: FinalOptions
): string | null {
  try {
    const mixinSourceDir = resolve(options.mixinSourceDir);
    const config = getImportSourceConfig('mixin', options);

    // Handle relative paths - must be within mixin source directory
    if (importPath.startsWith('.')) {
      const resolved = resolveRelativeImport(importPath, currentFilePath);
      if (isInMixinSourceDir(resolved, mixinSourceDir)) {
        return resolved;
      }
      return null;
    }

    // Use unified import path resolution
    const resolved = resolveImportPath(importPath, config);
    if (resolved) {
      return resolved;
    }

    logger.debug(`📋 Could not resolve mixin path '${importPath}'`);
    return null;
  } catch (error) {
    logger.debug(`📋 DEBUG: Error resolving path '${importPath}': ${String(error)}`);
    return null;
  }
}

/**
 * Count the number of shared leading path segments between two paths
 */
function commonPathPrefixLength(path1: string, path2: string): number {
  const parts1 = path1.split('/');
  const parts2 = path2.split('/');
  let common = 0;
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      common++;
    } else {
      break;
    }
  }
  return common;
}

/**
 * Extract polymorphic mixin references from pre-parsed model fields
 * Finds belongsTo fields with polymorphic: true whose type matches a mixin file basename
 */
function extractPolymorphicMixinReferences(
  parsedFile: ParsedFile,
  mixinFiles: string[],
  logger: InstanciatedLogger
): string[] {
  const polymorphicMixins: string[] = [];

  for (const field of parsedFile.fields) {
    if (field.kind !== 'belongsTo') continue;
    if (!field.type) continue;
    if (field.options?.polymorphic !== true) continue;

    const matches = mixinFiles.filter((mixinFile) => extractBaseName(mixinFile) === field.type);
    if (matches.length === 0) continue;

    let bestMatch: string;
    if (matches.length === 1) {
      bestMatch = matches[0];
    } else {
      const modelDir = dirname(parsedFile.path);
      bestMatch = matches.reduce((closest, current) => {
        const closestCommon = commonPathPrefixLength(modelDir, dirname(closest));
        const currentCommon = commonPathPrefixLength(modelDir, dirname(current));
        return currentCommon > closestCommon ? current : closest;
      });
      logger.warn(
        `Multiple mixin files match polymorphic type '${field.type}': ${matches.join(', ')}. Using '${bestMatch}' (closest to '${parsedFile.path}')`
      );
    }

    if (!polymorphicMixins.includes(bestMatch)) {
      polymorphicMixins.push(bestMatch);
      logger.debug(`Found polymorphic reference to mixin '${field.type}' via parsed fields`);
    }
  }

  return polymorphicMixins;
}

/**
 * Extract mixins referenced via type-only imports from pre-parsed import data
 * Uses ParsedFile.imports filtered by isTypeOnly
 */
function extractTypeOnlyMixinReferences(
  parsedFile: ParsedFile,
  mixinFiles: string[],
  logger: InstanciatedLogger,
  options: FinalOptions
): string[] {
  const typeOnlyMixins: string[] = [];

  for (const importInfo of parsedFile.imports) {
    if (!importInfo.isTypeOnly) continue;

    // Check if this import path resolves to a mixin file
    const resolved = resolveMixinPath(importInfo.path, parsedFile.path, logger, options);
    if (resolved && mixinFiles.includes(resolved)) {
      if (!typeOnlyMixins.includes(resolved)) {
        typeOnlyMixins.push(resolved);
        logger.debug(`Found type-only mixin reference: ${importInfo.path} -> ${resolved}`);
      }
    }
  }

  return typeOnlyMixins;
}
