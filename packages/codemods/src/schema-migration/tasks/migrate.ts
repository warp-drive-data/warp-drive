import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';

import { Codemod } from '../codemod.js';
import type { FinalOptions, MigrateOptions, TransformOptions } from '../config.js';
import { toArtifacts as mixinToArtifacts } from '../processors/mixin.js';
import {
  preAnalyzeConnectedMixinExtensions,
  processIntermediateModelsToTraits,
  toArtifacts as modelToArtifacts,
} from '../processors/model.js';
import { debugLog } from '../utils/ast-utils.js';
import type { ParsedFile } from '../utils/file-parser.js';
import { Logger } from '../utils/logger.js';

/**
 * JSCodeshift transform function that throws an error
 * migrate-to-schema is designed to run as a batch operation only
 */
export default function (): never {
  throw new Error(
    'migrate-to-schema should be run as a batch operation, not on individual files. Use the CLI command directly.'
  );
}

interface Artifact {
  type: string;
  code: string;
  suggestedFileName?: string;
}

interface ProcessingResult {
  processed: number;
  skipped: string[];
  errors: string[];
}

type ArtifactType = 'schema' | 'trait' | 'resource-extension' | 'trait-extension';

type DirectoryKey = 'resourcesDir' | 'traitsDir' | 'outputDir';

interface ArtifactConfig {
  directoryKey: DirectoryKey;
  defaultDir: string;
  /** Whether to use mixin-based relative path calculation */
  useRelativePath?: boolean;
  /** File suffix to append (e.g., '.schema', '.schema.types') */
  suffix?: string;
  /** Whether to preserve original extension */
  preserveExtension?: boolean;
  /** Whether to use suggested filename directly */
  useSuggestedFileName?: boolean;
}

const ARTIFACT_CONFIG: Record<ArtifactType, ArtifactConfig> = {
  schema: {
    directoryKey: 'resourcesDir',
    defaultDir: './app/data/resources',
    suffix: '.schema',
    preserveExtension: true,
  },
  trait: {
    directoryKey: 'traitsDir',
    defaultDir: './app/data/traits',
    useRelativePath: true,
    suffix: '.schema',
    preserveExtension: true,
  },
  'resource-extension': {
    directoryKey: 'resourcesDir',
    defaultDir: './app/data/resources',
    suffix: '.ext',
    preserveExtension: true,
  },
  'trait-extension': {
    directoryKey: 'traitsDir',
    defaultDir: './app/data/traits',
    useRelativePath: true,
    suffix: '.ext',
    preserveExtension: true,
  },
};

const DEFAULT_FALLBACK_CONFIG: ArtifactConfig = {
  directoryKey: 'outputDir',
  defaultDir: './app/schemas',
  useSuggestedFileName: true,
};

/**
 * Get relative path for a file from additionalModelSources
 */
function getRelativePathFromAdditionalSources(
  filePath: string,
  additionalSources?: Array<{ pattern: string; dir: string }>
): string | null {
  if (!additionalSources) return null;

  for (const source of additionalSources) {
    const sourceDirResolved = resolve(source.dir.replace(/\/?\*+$/, '')); // Remove trailing wildcards
    if (filePath.startsWith(sourceDirResolved)) {
      // File is from this additional source, extract just the basename
      return `/${basename(filePath)}`;
    }
  }
  return null;
}

/**
 * Get the relative path for a mixin file, handling both local and external mixins
 */
function getRelativePathForMixin(filePath: string, options: TransformOptions): string {
  // First, try to get relative path from the main mixin source directory
  const mixinSourceDir = resolve(options.mixinSourceDir || './app/mixins');
  if (filePath.startsWith(mixinSourceDir)) {
    return filePath.replace(mixinSourceDir, '').replace(/^\//, '');
  }

  // Check if this is an external mixin from additionalMixinSources
  if (options.additionalMixinSources) {
    for (const source of options.additionalMixinSources) {
      // Get the base directory (remove trailing /* if present)
      let baseDir = source.dir;
      if (baseDir.endsWith('/*')) {
        baseDir = baseDir.slice(0, -2);
      } else if (baseDir.endsWith('*')) {
        baseDir = baseDir.slice(0, -1);
      }

      const resolvedBaseDir = resolve(baseDir);
      if (filePath.startsWith(resolvedBaseDir)) {
        // For external mixins, use just the filename
        return basename(filePath);
      }
    }
  }

  // Fallback: use just the filename
  return basename(filePath);
}

/**
 * Calculate relative path for model-based artifacts (schema, resource-type)
 */
function getRelativePathForModel(filePath: string, options: TransformOptions): string {
  // Try standard model source directory first
  let relativePath = filePath.replace(resolve(options.modelSourceDir || './app/models'), '');

  // If not in standard directory, check additionalModelSources
  if (relativePath === filePath) {
    const additionalPath = getRelativePathFromAdditionalSources(filePath, options.additionalModelSources);
    if (additionalPath) {
      relativePath = additionalPath;
    } else if (options.generateExternalResources) {
      // Fallback: extract just the filename for external models
      relativePath = `/${basename(filePath)}`;
    }
  }

  return relativePath;
}

/**
 * Build the output filename based on suffix and extension settings
 */
function buildOutputFileName(
  relativePath: string,
  sourceFilePath: string,
  config: ArtifactConfig,
  suggestedFileName?: string
): string {
  if (config.useSuggestedFileName && suggestedFileName) {
    // For extension-type, apply suffix to suggested filename
    if (config.suffix && !config.preserveExtension) {
      return suggestedFileName.replace(/\.(js|ts)$/, `${config.suffix}.ts`);
    }
    return suggestedFileName;
  }

  if (!config.suffix) {
    return relativePath;
  }

  if (config.preserveExtension) {
    const extension = sourceFilePath.endsWith('.ts') ? '.ts' : '.js';
    return relativePath.replace(/\.(js|ts)$/, `${config.suffix}${extension}`);
  }

  return relativePath.replace(/\.(js|ts)$/, `${config.suffix}.ts`);
}

/**
 * Get the output directory for an artifact type
 */
function getOutputDirectory(artifactType: string, options: TransformOptions): string {
  const config = ARTIFACT_CONFIG[artifactType as ArtifactType] ?? DEFAULT_FALLBACK_CONFIG;
  return options[config.directoryKey] ?? config.defaultDir;
}

/**
 * Get the output path for an artifact based on its type and source file
 */
function getArtifactOutputPath(
  artifact: Artifact,
  filePath: string,
  options: TransformOptions
): { outputDir: string; outputPath: string } {
  const config = ARTIFACT_CONFIG[artifact.type as ArtifactType] ?? DEFAULT_FALLBACK_CONFIG;
  const outputDir = getOutputDirectory(artifact.type, options);

  // Debug logging for resource-type-stub
  if (artifact.type === 'resource-type-stub') {
    debugLog(options, `RESOURCE-TYPE-STUB: redirecting to resources dir`);
  }

  // Calculate relative path based on artifact type
  const relativePath = config.useRelativePath
    ? getRelativePathForMixin(filePath, options)
    : config.useSuggestedFileName
      ? ''
      : getRelativePathForModel(filePath, options);

  // Build the output filename
  const outputName = config.useSuggestedFileName
    ? buildOutputFileName('', filePath, config, artifact.suggestedFileName) || 'unknown'
    : buildOutputFileName(relativePath, filePath, config);

  const outputPath = join(resolve(outputDir), outputName);

  return { outputDir, outputPath };
}

interface WriteArtifactOptions {
  dryRun: boolean;
  verbose: boolean;
  logger: Logger;
}

/**
 * Write a single artifact to disk
 */
function writeArtifact(
  artifact: Artifact,
  outputPath: string,
  { dryRun, verbose, logger }: WriteArtifactOptions
): void {
  if (!dryRun) {
    const outputDirPath = dirname(outputPath);
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }
    writeFileSync(outputPath, artifact.code, 'utf-8');
    if (verbose) {
      logger.info(`✅ Generated ${artifact.type}: ${outputPath}`);
    }
  } else if (verbose) {
    logger.info(`✅ Would generate ${artifact.type}: ${outputPath} (dry run)`);
  }
}

/**
 * Write intermediate model trait artifacts to disk
 */
function writeIntermediateArtifacts(artifacts: Artifact[], finalOptions: FinalOptions, logger: Logger): void {
  for (const artifact of artifacts) {
    // For intermediate artifacts, we use the suggested filename directly
    const outputDir = getOutputDirectory(artifact.type, finalOptions);
    if (!artifact.suggestedFileName) {
      throw new Error("Couldn't get an artifact `suggestedFileName`");
    }

    const fileName = artifact.suggestedFileName;

    const outputPath = join(resolve(outputDir), fileName);
    writeArtifact(artifact, outputPath, {
      dryRun: finalOptions.dryRun ?? false,
      verbose: finalOptions.verbose ?? false,
      logger,
    });
  }
}

type ArtifactTransformer = (parsedFile: ParsedFile, options: TransformOptions) => Artifact[];

interface ProcessFilesOptions {
  parsedFiles: Map<string, ParsedFile>;
  transformer: ArtifactTransformer;
  finalOptions: FinalOptions;
  logger: Logger;
}

/**
 * Generic file processor for both models and mixins
 * Uses pre-parsed ParsedFile data for efficient processing
 */
function processFiles({ parsedFiles, transformer, finalOptions, logger }: ProcessFilesOptions): ProcessingResult {
  let processed = 0;
  const skipped = [];
  const errors = [];

  for (const [filePath, parsedFile] of parsedFiles) {
    try {
      if (finalOptions.verbose) {
        logger.debug(`🔄 Processing: ${filePath}`);
      }

      const artifacts = transformer(parsedFile, finalOptions);

      if (artifacts.length > 0) {
        processed++;

        for (const artifact of artifacts) {
          const { outputPath } = getArtifactOutputPath(artifact, filePath, finalOptions);

          writeArtifact(artifact, outputPath, {
            dryRun: finalOptions.dryRun ?? false,
            verbose: finalOptions.verbose ?? false,
            logger,
          });
        }
      } else {
        skipped.push(filePath);
      }
    } catch (error) {
      errors.push(filePath);
      logger.error(`❌ Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { processed, skipped, errors };
}

/**
 * Run the migration for multiple files
 */
export async function runMigration(options: MigrateOptions): Promise<void> {
  const finalOptions: FinalOptions = {
    kind: 'finalized',
    inputDir: options.inputDir || './app',
    outputDir: options.outputDir || './app/schemas',
    dryRun: options.dryRun || false,
    verbose: options.verbose || false,
    modelSourceDir: options.modelSourceDir || './app/models',
    mixinSourceDir: options.mixinSourceDir || './app/mixins',
    ...options,
  };

  const logger = new Logger(finalOptions.verbose);
  logger.info(`🚀 Starting schema migration...`);
  logger.info(`📁 Input directory: ${resolve(finalOptions.inputDir || './app')}`);
  logger.info(`📁 Output directory: ${resolve(finalOptions.outputDir || './app/schemas')}`);

  const codemod = new Codemod(logger, finalOptions);

  // Ensure output directories exist (specific directories are created as needed)
  if (!finalOptions.dryRun) {
    codemod.createDestinationDirectories();
  }

  if (!options.mixinsOnly) {
    await codemod.findModels();
  }

  if (!options.modelsOnly) {
    await codemod.findMixins();
  }

  codemod.parseAllFiles();

  if (!options.mixinsOnly) {
    codemod.findMixinsUsedByModels();
    codemod.findModelExtensions();
  }

  const filesToProcess: number = codemod.input.mixins.size + codemod.input.models.size;

  if (filesToProcess === 0) {
    logger.info('✅ No files found to process.');
    return;
  }

  logger.info(`📋 Processing ${filesToProcess} files total`);
  logger.info(`📋 Found ${codemod.input.models.size} model and ${codemod.input.mixins.size} mixin files`);

  logger.warn(`📋 Skipped ${codemod.input.skipped.length} files total`);
  logger.warn(`📋 Errors found while reading files: ${codemod.input.errors.length}`);

  // Unfortunately a lot of the utils rely on the options object to carry a lot of the data currently
  // It'd take a lot of changes to make them use the codemod instance instead.
  finalOptions.allModelFiles = Array.from(codemod.input.parsedModels.keys());
  finalOptions.allMixinFiles = Array.from(codemod.input.parsedMixins.keys());
  finalOptions.modelsWithExtensions = codemod.modelsWithExtensions;
  finalOptions.modelConnectedMixins = codemod.mixinsImportedByModels;
  preAnalyzeConnectedMixinExtensions(codemod.input.parsedMixins, finalOptions);

  // Process intermediate models to generate trait artifacts first
  // This must be done before processing regular models that extend these intermediate models
  if (finalOptions.intermediateModelPaths && finalOptions.intermediateModelPaths.length > 0) {
    try {
      logger.info(`🔄 Processing ${finalOptions.intermediateModelPaths.length} intermediate models...`);
      const intermediateResults = processIntermediateModelsToTraits(
        Array.isArray(finalOptions.intermediateModelPaths)
          ? finalOptions.intermediateModelPaths
          : [finalOptions.intermediateModelPaths],
        finalOptions.additionalModelSources,
        finalOptions.additionalMixinSources,
        finalOptions
      );

      // Write intermediate model trait artifacts
      writeIntermediateArtifacts(intermediateResults.artifacts, finalOptions, logger);

      if (intermediateResults.errors.length > 0) {
        logger.error(`⚠️ Errors processing intermediate models:`);
        for (const error of intermediateResults.errors) {
          logger.error(`   ${String(error)}`);
        }
      }

      logger.info(`✅ Processed ${intermediateResults.artifacts.length} intermediate model artifacts`);
    } catch (error) {
      logger.error(`❌ Error processing intermediate models: ${String(error)}`);
    }
  }

  // Process model files using pre-parsed data
  const modelResults = processFiles({
    parsedFiles: codemod.input.parsedModels,
    transformer: modelToArtifacts,
    finalOptions,
    logger,
  });

  // Process mixin files using pre-parsed data
  const mixinResults = processFiles({
    parsedFiles: codemod.input.parsedMixins,
    transformer: mixinToArtifacts,
    finalOptions,
    logger,
  });

  // Aggregate results
  const processed = modelResults.processed + mixinResults.processed;
  const skipped = modelResults.skipped.length + mixinResults.skipped.length;
  const errors = modelResults.errors.length + mixinResults.errors.length;

  logger.info(`\n✅ Migration complete!`);
  logger.info(`   📊 Processed: ${processed}`);
  logger.info(
    `   ⏭️  Skipped: ${skipped} - Mixins: ${mixinResults.skipped.length}, Models: ${modelResults.skipped.length}`
  );

  if (options.verbose) {
    logger.warn(
      `Skipped:\n   Mixins:\n ${mixinResults.skipped.join(', ')}\n   Models: ${modelResults.skipped.join(', ')}`
    );
  }
  if (errors > 0) {
    logger.info(`   ❌ Errors: ${errors} files`);
  }
}
