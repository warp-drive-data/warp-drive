import type { Command } from 'commander';
import { Argument, Option } from 'commander';

import { logger } from '../../utils/logger.js';
import type { RunOptions } from '../legacy-compat-builders/run.js';
import type { MigrateOptions } from '../schema-migration/config.ts';
import { type ConfigOptions, loadConfig, mergeOptions } from '../schema-migration/utils/config.js';
import type { SharedCodemodOptions } from './index.js';

export function createApplyCommand(program: Command) {
  const applyCommand = program
    .command('apply')
    .description('apply the given codemod to the target file paths')
    .addArgument(new Argument('<codemod>').choices(['migrate-to-schema', 'legacy-compat-builders']));

  createMigrateToSchemaCommand(applyCommand);
  createLegacyCompatBuildersCommand(applyCommand);
}

function addSharedOptions(command: Command) {
  command
    .addOption(new Option('-d, --dry', 'dry run (no changes are made to files)'))
    .addOption(
      new Option('-v, --verbose <level>', 'Show more information about the transform process')
        .choices(['0', '1', '2'])
        .default('0')
    )
    .addOption(
      new Option(
        '-l, --log-file [path]',
        'Write logs to a file. If option is set but no path is provided, logs are written to ember-data-codemods.log'
      )
    )
    .addOption(
      new Option(
        '-i, --ignore <ignore-glob-pattern...>',
        'Ignores the given file or glob pattern. If using glob pattern, wrap in single quotes.'
      )
    );
}

function createMigrateToSchemaCommand(applyCommand: Command) {
  const command = applyCommand
    .command('migrate-to-schema')
    .description('Migrates both EmberData models and mixins to WarpDrive schemas in batch.');

  command.argument('[input-dir]', 'Input directory to search for models and mixins', './app');

  addSharedOptions(command);

  command
    .addOption(new Option('--config <path>', 'Path to configuration file'))
    .addOption(new Option('--skip-processed', 'Skip files that have already been processed'))
    .addOption(new Option('--model-source-dir <path>', 'Directory containing model files').default('./app/models'))
    .addOption(new Option('--mixin-source-dir <path>', 'Directory containing mixin files').default('./app/mixins'))
    .addOption(new Option('--output-dir <path>', 'Output directory for generated schemas').default('./app/data'))
    .action(async (patterns: string[] | string, options: SharedCodemodOptions & Record<string, unknown>) => {
      logger.config(options);
      return handleMigrateToSchema(patterns, options);
    });
}

function createLegacyCompatBuildersCommand(applyCommand: Command) {
  const command = applyCommand
    .command('legacy-compat-builders')
    .description(
      'Updates legacy store methods to use `store.request` and `@ember-data/legacy-compat/builders` instead.'
    );

  command.argument(
    '<target-glob-pattern...>',
    'Path to files or glob pattern. If using glob pattern, wrap in single quotes.'
  );

  addSharedOptions(command);

  command
    .addOption(
      new Option(
        '--store-names <store-name...>',
        "Identifier name associated with the store. If overriding, it is recommended that you include 'store' in your list."
      ).default(['store'])
    )
    .addOption(
      new Option(
        '--method, --methods <method-name...>',
        'Method name(s) to transform. By default, will transform all methods.'
      ).choices(['findAll', 'findRecord', 'query', 'queryRecord', 'saveRecord'])
    )
    .action(async (patterns: string[] | string, options: SharedCodemodOptions & RunOptions) => {
      logger.config(options);
      return handleLegacyCompatBuilders(patterns, options);
    });
}

async function handleLegacyCompatBuilders(patterns: string[] | string, options: SharedCodemodOptions & RunOptions) {
  const { runTransform } = await import('../legacy-compat-builders/run.js');
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  await runTransform({
    patterns: patternArray,
    dry: options.dry,
    ignore: options.ignore,
    storeNames: options.storeNames,
    methods: options.methods,
  });
}

async function handleMigrateToSchema(
  patterns: string[] | string,
  options: SharedCodemodOptions & Record<string, unknown>
) {
  const log = logger.for('migrate-to-schema');
  const { runMigration } = await import('../schema-migration/tasks/migrate.js');
  const inputDir = (typeof patterns === 'string' ? patterns : patterns[0]) || './app';

  let configOptions = {};
  if (options.config) {
    try {
      configOptions = loadConfig(String(options.config));
      log.info(`Loaded configuration from: ${String(options.config)}`);
    } catch (error) {
      log.error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  const cliOptions: ConfigOptions = {
    ...(options as ConfigOptions),
    inputDir,
    ...(options.dry !== undefined && { dryRun: Boolean(options.dry) }),
    ...(options.verbose !== undefined && { verbose: options.verbose === '1' || options.verbose === '2' }),
    ...(options.debug !== undefined && { debug: Boolean(options.debug) }),
    ...(options.modelsOnly !== undefined && { modelsOnly: Boolean(options.modelsOnly) }),
    ...(options.mixinsOnly !== undefined && { mixinsOnly: Boolean(options.mixinsOnly) }),
    ...(options.skipProcessed !== undefined && { skipProcessed: Boolean(options.skipProcessed) }),
    modelSourceDir: String(options.modelSourceDir || './app/models'),
    mixinSourceDir: String(options.mixinSourceDir || './app/mixins'),
    outputDir: String(options.outputDir || './app/schemas'),
    ...(options.generateExternalResources !== undefined && {
      generateExternalResources: Boolean(options.generateExternalResources),
    }),
    intermediateModelPaths: Array.isArray(options.intermediateModelPaths)
      ? options.intermediateModelPaths
      : options.intermediateModelPaths
        ? [options.intermediateModelPaths]
        : undefined,
  };
  const mergedOptions = mergeOptions(cliOptions, configOptions);

  const normalizedIntermediateModelPaths = Array.isArray(mergedOptions.intermediateModelPaths)
    ? mergedOptions.intermediateModelPaths
    : mergedOptions.intermediateModelPaths
      ? [mergedOptions.intermediateModelPaths]
      : undefined;

  const normalizedTypeMapping =
    typeof mergedOptions.typeMapping === 'string'
      ? (JSON.parse(mergedOptions.typeMapping) as Record<string, string>)
      : mergedOptions.typeMapping;

  const migrationOptions: MigrateOptions = {
    ...mergedOptions,
    intermediateModelPaths: normalizedIntermediateModelPaths,
    typeMapping: normalizedTypeMapping,
  };

  try {
    await runMigration(migrationOptions);
    log.success('Migration completed successfully! 🎉');
  } catch (error) {
    log.error('Migration failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
