import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { glob } from 'glob';
import { basename, extname, join, resolve } from 'path';

import type { FinalOptions } from './config.js';
import { analyzeModelMixinUsage } from './processors/mixin-analyzer.js';
import type { ParsedFile } from './utils/file-parser.js';
import { parseFile } from './utils/file-parser.js';
import type { Logger } from './utils/logger.js';
import { FILE_EXTENSION_REGEX, TRAILING_SINGLE_WILDCARD_REGEX, TRAILING_WILDCARD_REGEX } from './utils/string.js';

export type Filename = string;
export type InputFile = { path: string; code: string };

/**
 * Check if a file path matches any intermediate model path
 */
function isIntermediateModel(
  filePath: string,
  intermediateModelPaths?: string[],
  additionalModelSources?: Array<{ pattern: string; dir: string }>
): boolean {
  if (!intermediateModelPaths) return false;

  const fileBaseName = basename(filePath, extname(filePath));

  for (const intermediatePath of intermediateModelPaths) {
    // Handle paths with extensions (e.g., "my-app/core/base-model.js")
    const intermediateBaseName = basename(intermediatePath, extname(intermediatePath));

    if (fileBaseName === intermediateBaseName) {
      // Check if file is from a matching additional source
      if (additionalModelSources) {
        for (const source of additionalModelSources) {
          const sourceDirResolved = resolve(source.dir.replace(TRAILING_WILDCARD_REGEX, ''));
          if (filePath.startsWith(sourceDirResolved)) {
            return true;
          }
        }
      }

      // Also check if it's in app/core
      if (filePath.includes('/app/core/')) {
        return true;
      }
    }
  }

  return false;
}

function expandGlobPattern(dir: string): string {
  // Convert dir pattern to glob pattern (e.g., "path/to/models/*" -> "path/to/models/**/*.{js,ts}")
  let dirGlobPattern = dir;
  if (dirGlobPattern.endsWith('*')) {
    // Replace trailing * with **/*.{js,ts}
    dirGlobPattern = dirGlobPattern.replace(TRAILING_SINGLE_WILDCARD_REGEX, '**/*.{js,ts}');
  } else {
    // Add **/*.{js,ts} if no glob pattern
    dirGlobPattern = join(dirGlobPattern, '**/*.{js,ts}');
  }

  return resolve(dirGlobPattern);
}

async function findFiles(
  sources: string[],
  predicate: (file: string) => boolean,
  finalOptions: FinalOptions,
  logger: Logger
): Promise<{ output: InputFile[]; skipped: string[]; errors: Error[] }> {
  const output: InputFile[] = [];
  const errors: Error[] = [];
  const skipped: string[] = [];

  for (const source of sources) {
    try {
      const files = await glob(source);

      for (const file of files) {
        if (predicate(file)) {
          const content = await readFile(file, 'utf-8');

          output.push({ path: file, code: content });
        } else {
          skipped.push(file);
        }
      }

      if (finalOptions.verbose) {
        logger.info(
          `📋 Found ${output.length} files at '${source}' (Total: '${output.length}', Skipped: '${skipped.length}' Sources: '[${sources.join(',')}]')`
        );
      }
    } catch (error: unknown) {
      logger.error(`Failed to process file source ${source}: ${String(error)}`);
      errors.push(error as Error);
    }
  }

  return { output, skipped, errors };
}

export class Input {
  models: Map<Filename, InputFile> = new Map();
  mixins: Map<Filename, InputFile> = new Map();
  parsedModels: Map<Filename, ParsedFile> = new Map();
  parsedMixins: Map<Filename, ParsedFile> = new Map();
  skipped: string[] = [];
  errors: Error[] = [];
}

export class Codemod {
  logger: Logger;
  finalOptions: FinalOptions;
  input: Input = new Input();

  mixinsImportedByModels: Set<string> = new Set();
  modelsWithExtensions: Set<string> = new Set();

  constructor(logger: Logger, finalOptions: FinalOptions) {
    this.logger = logger;
    this.finalOptions = finalOptions;
  }

  findMixinsUsedByModels() {
    const result = analyzeModelMixinUsage(this, this.finalOptions);
    this.mixinsImportedByModels = result.connectedMixins;
    this.finalOptions.modelToMixinsMap = result.modelToMixinsMap;
  }

  findModelExtensions() {
    this.logger.info(`🔍 Analyzing which models will have extensions...`);
    for (const [modelFile, parsedModel] of this.input.parsedModels) {
      try {
        // Use pre-parsed data instead of re-parsing
        if (parsedModel.hasExtension) {
          this.modelsWithExtensions.add(parsedModel.baseName);
        }
      } catch (error) {
        this.logger.error(`❌ Error analyzing model ${modelFile} for extensions: ${String(error)}`);
      }
    }
    this.logger.info(`✅ Found ${this.modelsWithExtensions.size} models with extensions.`);
  }

  parseAllFiles() {
    this.logger.info(`🔄 Parsing all files into intermediate structure...`);

    let modelsParsed = 0;
    let mixinsParsed = 0;
    let parseErrors = 0;

    for (const [filePath, inputFile] of this.input.models) {
      try {
        const parsed = parseFile(filePath, inputFile.code, this.finalOptions);
        this.input.parsedModels.set(filePath, parsed);
        modelsParsed++;
      } catch (error) {
        this.logger.error(`❌ Error parsing model ${filePath}: ${String(error)}`);
        parseErrors++;
      }
    }

    for (const [filePath, inputFile] of this.input.mixins) {
      try {
        const parsed = parseFile(filePath, inputFile.code, this.finalOptions);
        this.input.parsedMixins.set(filePath, parsed);
        mixinsParsed++;
      } catch (error) {
        this.logger.error(`❌ Error parsing mixin ${filePath}: ${String(error)}`);
        parseErrors++;
      }
    }

    this.logger.info(`✅ Parsed ${modelsParsed} models and ${mixinsParsed} mixins (${parseErrors} errors).`);
  }

  createDestinationDirectories() {
    // Only create specific directories if they are configured
    // The generic outputDir is only used for fallback artifacts and shouldn't be pre-created
    if (this.finalOptions.traitsDir) {
      mkdirSync(resolve(this.finalOptions.traitsDir), { recursive: true });
    }
    // extensions are now co-located with their schemas
    // in resourcesDir (for resource-extension) and traitsDir (for trait-extension)
    if (this.finalOptions.resourcesDir) {
      mkdirSync(resolve(this.finalOptions.resourcesDir), { recursive: true });
    }
  }

  async findModels() {
    // TODO: || './app/models'
    if (!this.finalOptions.modelSourceDir) {
      throw new Error('`options.modelSourceDir` must be specified before looking for files');
    }

    const filePattern = join(resolve(this.finalOptions.modelSourceDir), '**/*.{js,ts}');
    const fileSources = [filePattern];

    if (this.finalOptions.additionalModelSources) {
      for (const source of this.finalOptions.additionalModelSources) {
        fileSources.push(expandGlobPattern(source.dir));
      }
    }

    const models = await findFiles(
      fileSources,
      (file) => {
        return (
          existsSync(file) &&
          (!this.finalOptions.skipProcessed || !isAlreadyProcessed(file)) &&
          !isIntermediateModel(file, this.finalOptions.intermediateModelPaths, this.finalOptions.additionalModelSources)
        );
      },
      this.finalOptions,
      this.logger
    );

    for (const inputFile of models.output) {
      this.input.models.set(inputFile.path, inputFile);
    }
    this.input.errors.push(...models.errors);
    this.input.skipped.push(...models.skipped);
  }

  async findMixins() {
    if (!this.finalOptions.mixinSourceDir) {
      throw new Error('`options.mixinSourceDir` must be specified before looking for files');
    }

    const filePattern = join(resolve(this.finalOptions.mixinSourceDir), '**/*.{js,ts}');
    const fileSources = [filePattern];

    if (this.finalOptions.additionalMixinSources) {
      for (const source of this.finalOptions.additionalMixinSources) {
        fileSources.push(expandGlobPattern(source.dir));
      }
    }

    const models = await findFiles(
      fileSources,
      (file) => {
        return existsSync(file) && (!this.finalOptions.skipProcessed || !isAlreadyProcessed(file));
      },
      this.finalOptions,
      this.logger
    );

    for (const inputFile of models.output) {
      this.input.mixins.set(inputFile.path, inputFile);
    }

    this.input.errors.push(...models.errors);
    this.input.skipped.push(...models.skipped);
  }
}

/**
 * Check if a file has already been processed
 */
function isAlreadyProcessed(filePath: string): boolean {
  // Simple heuristic: check if a corresponding schema file exists
  const outputPath = filePath
    .replace('/models/', '/schemas/')
    .replace('/mixins/', '/traits/')
    .replace(FILE_EXTENSION_REGEX, '.ts');

  return existsSync(outputPath);
}
