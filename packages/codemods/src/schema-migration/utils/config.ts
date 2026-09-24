import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';

export interface ConfigOptions {
  dryRun?: boolean;
  verbose?: boolean;
  debug?: boolean;
  forceTypeScript?: boolean;
  mirror?: boolean;
  projectName?: string;
  warpDriveImports?: 'legacy' | 'modern' | 'mirror';
  emberDataImportSource?: string;
  intermediateModelPaths?: string[] | string;
  modelImportSource?: string;
  mixinImportSource?: string;
  modelSourceDir?: string;
  mixinSourceDir?: string;
  additionalModelSources?: Array<{ pattern: string; dir: string }>;
  additionalMixinSources?: Array<{ pattern: string; dir: string }>;
  resourcesImport?: string;
  traitsDir?: string;
  traitsImport?: string;
  resourcesDir?: string;
  typeMapping?: Record<string, string> | string;
  modelsOnly?: boolean;
  mixinsOnly?: boolean;
  skipProcessed?: boolean;
  generateExternalResources?: boolean;
  importSubstitutes?: Array<{ import: string; extension?: string; trait?: string }>;
  config?: string;
  input?: string;
  inputDir?: string;
  output?: string;
  outputDir?: string;
  runPostTransformLinting?: boolean;
  runPostTransformPrettier?: boolean;
  eslintConfigPath?: string;
  prettierConfigPath?: string;
}

export interface FullConfig extends ConfigOptions {
  $schema?: string;
  version?: string;
  description?: string;
}

/**
 * Load configuration from a JSON file
 */
export function loadConfig(configPath: string): ConfigOptions {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const content = readFileSync(configPath, 'utf8');
    const config = JSON.parse(content) as FullConfig;

    // Remove metadata fields that shouldn't be used as CLI options
    // oxlint-disable-next-line no-unused-vars
    const { $schema, version, description, ...options } = config;

    // Resolve relative paths in config relative to the config file's directory
    const resolvedOptions = resolveConfigPaths(options, dirname(configPath));

    return resolvedOptions;
  } catch (error) {
    throw new Error(`Failed to parse configuration file: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}

/**
 * Save configuration to a JSON file
 */
export function saveConfig(configPath: string, options: ConfigOptions): void {
  const fullConfig: FullConfig = {
    $schema: './config-schema.json',
    version: '1.0.0',
    description: 'Configuration for warp-drive-codemod',
    ...options,
  };

  try {
    const content = JSON.stringify(fullConfig, null, 2);
    writeFileSync(configPath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to save configuration file: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}

/**
 * Merge CLI options with config file options, with CLI taking precedence
 * Generic version that preserves the CLI options type
 */
export function mergeOptions<T extends ConfigOptions>(cliOptions: T, configOptions: ConfigOptions = {}): T {
  const merged = { ...configOptions } as T;

  // CLI options override config file options
  for (const [key, value] of Object.entries(cliOptions)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

/**
 * Validate that required directories and import paths are specified for a given transform type
 */
export function validateConfigForTransform(
  config: ConfigOptions,
  transformType: 'model-to-schema' | 'mixin-to-schema'
): string[] {
  const errors: string[] = [];

  // Validate required import paths for all transforms
  if (!config.modelImportSource) {
    errors.push('modelImportSource is required for all transforms');
  }
  if (!config.resourcesImport) {
    errors.push('resourcesImport is required for all transforms');
  }

  if (transformType === 'model-to-schema') {
    if (!config.resourcesDir) {
      errors.push('resourcesDir is required for model-to-schema transforms');
    }
  } else if (transformType === 'mixin-to-schema') {
    if (!config.traitsDir) {
      errors.push('traitsDir is required for mixin-to-schema transforms');
    }
  }

  return errors;
}

/**
 * List of config properties that contain paths
 */
const PATH_PROPERTIES: Array<keyof ConfigOptions> = ['traitsDir', 'resourcesDir', 'modelSourceDir', 'mixinSourceDir'];

/**
 * Internal helper to resolve paths in configuration options relative to a base directory
 * @param config The configuration options
 * @param baseDir The base directory to resolve relative paths against
 */
function resolvePathsInternal(config: ConfigOptions, baseDir: string): ConfigOptions {
  const resolved = { ...config };

  for (const prop of PATH_PROPERTIES) {
    const value = resolved[prop];
    if (typeof value === 'string' && value) {
      // If the path is relative, resolve it relative to the base directory
      if (!isAbsolute(value)) {
        (resolved as Record<string, unknown>)[prop] = resolve(baseDir, value);
      }
    }
  }

  // Handle additionalModelSources and additionalMixinSources arrays
  if (resolved.additionalModelSources) {
    resolved.additionalModelSources = resolved.additionalModelSources.map((source) => ({
      ...source,
      dir: isAbsolute(source.dir) ? source.dir : resolve(baseDir, source.dir),
    }));
  }

  if (resolved.additionalMixinSources) {
    resolved.additionalMixinSources = resolved.additionalMixinSources.map((source) => ({
      ...source,
      dir: isAbsolute(source.dir) ? source.dir : resolve(baseDir, source.dir),
    }));
  }

  return resolved;
}

/**
 * Resolve relative paths in configuration options relative to a base directory
 * @param config The configuration options
 * @param baseDir The base directory to resolve relative paths against (typically the config file's directory)
 */
export function resolveConfigPaths(config: ConfigOptions, baseDir: string): ConfigOptions {
  return resolvePathsInternal(config, baseDir);
}

/**
 * Normalize directory paths from CLI arguments
 * @param options The configuration options from CLI
 * @param cwd The current working directory
 */
export function normalizeCliPaths(options: ConfigOptions, cwd: string = process.cwd()): ConfigOptions {
  return resolvePathsInternal(options, cwd);
}
