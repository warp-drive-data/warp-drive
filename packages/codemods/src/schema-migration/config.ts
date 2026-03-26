export const DEFAULT_RESOURCES_DIR = './app/data/resources';
export const DEFAULT_TRAITS_DIR = './app/data/traits';
export const DEFAULT_INPUT_DIR = './app';
export const DEFAULT_OUTPUT_DIR = './app/schemas';
export const DEFAULT_MODEL_SOURCE_DIR = './app/models';
export const DEFAULT_MIXIN_SOURCE_DIR = './app/mixins';
export const DEFAULT_WARP_DRIVE_IMPORTS = 'modern' as const;

export interface PackageImport {
  imported: string;
  local?: string;
  source: string;
  isType?: boolean;
}
interface TransformPackageImports {
  Model: PackageImport;
  /**
   * if not present, assumed to be a named import from
   * the same source as model
   */
  attr?: PackageImport;
  /**
   * if not present, assumed to be a named import from
   * the same source as model
   */
  belongsTo?: PackageImport;
  /**
   * if not present, assumed to be a named import from
   * the same source as model
   */
  hasMany?: PackageImport;
  /**
   * if not present, assumed to be a named import from
   * the same source as model
   */
  AsyncHasMany?: PackageImport;
  /**
   * if not present, assumed to be a named import from
   * the same source as model
   */
  HasMany?: PackageImport;
  Type: PackageImport;
  WithLegacy: PackageImport;
  LegacyResourceSchema: PackageImport;
  LegacyTrait: PackageImport;
  withDefaults?: PackageImport;
}

export const LegacyPackageImports = {
  Model: { imported: 'default', source: '@ember-data/model' },
  Type: { imported: 'Type', source: '@warp-drive/core-types/symbols' },
  WithLegacy: { imported: 'WithLegacy', source: '@ember-data/model/migration-support' },
  withDefaults: { imported: 'withDefaults', source: '@ember-data/model/migration-support' },
  LegacyResourceSchema: { imported: 'LegacyResourceSchema', source: '@warp-drive/core-types/schema/fields' },
  LegacyTrait: { imported: 'LegacyTrait', source: '@warp-drive/core-types/schema/fields' },
} satisfies TransformPackageImports;
export const ModernPackageImports = {
  Model: { imported: 'Model', source: '@warp-drive/legacy/model' },
  Type: { imported: 'Type', source: '@warp-drive/core/types/symbols' },
  WithLegacy: { imported: 'WithLegacy', source: '@warp-drive/legacy/model/migration-support' },
  withDefaults: { imported: 'withDefaults', source: '@warp-drive/legacy/model/migration-support' },
  LegacyResourceSchema: { imported: 'LegacyResourceSchema', source: '@warp-drive/core/types/schema/fields' },
  LegacyTrait: { imported: 'LegacyTrait', source: '@warp-drive/core/types/schema/fields' },
} satisfies TransformPackageImports;
export const MirrorPackageImports = {
  Model: { imported: 'Model', source: '@warp-drive-mirror/legacy/model' },
  Type: { imported: 'Type', source: '@warp-drive-mirror/core/types/symbols' },
  WithLegacy: { imported: 'WithLegacy', source: '@warp-drive-mirror/legacy/model/migration-support' },
  withDefaults: { imported: 'withDefaults', source: '@warp-drive-mirror/legacy/model/migration-support' },
  LegacyResourceSchema: { imported: 'LegacyResourceSchema', source: '@warp-drive-mirror/core/types/schema/fields' },
  LegacyTrait: { imported: 'LegacyTrait', source: '@warp-drive-mirror/core/types/schema/fields' },
} satisfies TransformPackageImports;

type OptionalImportKey = 'withDefaults';
type GuaranteedImportKey = Exclude<keyof TransformPackageImports, OptionalImportKey>;

export function getConfiguredImport(config: TransformOptions, importName: GuaranteedImportKey): PackageImport;
export function getConfiguredImport(config: TransformOptions, importName: OptionalImportKey): PackageImport | undefined;
export function getConfiguredImport(
  config: TransformOptions,
  importName: keyof TransformPackageImports
): PackageImport | undefined {
  const warpDriveImports = config.warpDriveImports ?? 'modern';
  const packageImports =
    warpDriveImports === 'legacy'
      ? LegacyPackageImports
      : warpDriveImports === 'modern'
        ? ModernPackageImports
        : warpDriveImports === 'mirror'
          ? MirrorPackageImports
          : warpDriveImports;

  if (importName in packageImports) {
    return packageImports[importName as keyof typeof packageImports];
  } else if (importName === 'attr' || importName === 'belongsTo' || importName === 'hasMany') {
    // typically these imports are from the same source as model
    return { imported: importName, source: packageImports.Model.source };
  } else if (importName === 'AsyncHasMany' || importName === 'HasMany') {
    // typically these imports are from the same source as model
    return { imported: importName, source: packageImports.Model.source, isType: true };
  } else {
    return undefined;
  }
}

export interface TransformOptions {
  verbose?: boolean;
  debug?: boolean;
  dryRun?: boolean;
  /**
   * Determines what WarpDrive library imports to expect.
   *
   * 'legacy' - expects imports from the classic "ember-data" packages e.g. '@ember-data/model'
   * 'modern' - expects imports from the new "warp-drive" packages e.g. '@warp-drive/legacy/model'
   * 'mirror' - expects imports from '@warp-drive-mirror' packages e.g. '@warp-drive-mirror/legacy/model'
   * custom object - allows specifying custom import sources for the codemod. Useful if your app aliases
   * or re-exports WarpDrive apis from a different location.
   *
   */
  warpDriveImports: 'legacy' | 'modern' | 'mirror' | TransformPackageImports;
  /**
   * Whether generated imports for related resources should use extensions on
   * import paths from other project files. Defaults to false.
   */
  projectImportsUseExtensions?: boolean;
  /** Combine schemas and types into a single file. By default these will be in separate files */
  combineSchemasAndTypes?: boolean;
  /** By default, schemas will be output in TS files even when generated from untyped models. */
  disableTypescriptSchemas?: boolean;
  /** Force all output files to be TypeScript (.ts) even when input files are JavaScript (.js). */
  forceTypeScript?: boolean;
  /**
   * By default, the codemod will attempt to generate TypeScript types for models that don't
   * have them by analyzing the model file and various transforms that are in use.
   *
   * We heavily discourage turning this off as field level documentation comments are
   * associated to the type artifact, not the schema.
   */
  disableMissingTypeAutoGen?: boolean;
  /**
   * By default, the codemod will insert useful comments
   * to the generated types for inline/editor documentation
   * to use.
   *
   * These comments will be combined with any existing comment
   * on the class/mixin declaration.
   */
  disableAddingTypeComments?: boolean;
  /**
   * By default, unless `disableAddingTypeComments` is set to true, the
   * codemod will insert an additional `TIP` section in the generated
   * type comments to help guide users on how to properly use types
   * in WarpDrive. This disables that.
   */
  disableAddingTypeUsageTips?: boolean;
  /** Use @warp-drive-mirror instead of @warp-drive for imports */
  mirror?: boolean;
  /** Specify alternate import sources for EmberData decorators (default: '@ember-data/model') */
  emberDataImportSource?: string;
  /** List of intermediate model class import paths that should be converted to traits (e.g., ['my-app/core/base-model', 'my-app/core/data-field-model']) */
  intermediateModelPaths?: string[];
  /** List of intermediate fragment class import paths that should be converted to traits (e.g., ['app/fragments/base-fragment']) */
  intermediateFragmentPaths?: string[];
  /** Specify base import path for existing model imports to detect and replace (required) */
  modelImportSource?: string;
  /** Specify base import path for existing mixin imports to detect and replace (optional) */
  mixinImportSource?: string;
  /** Map source directories to their import paths for relative import resolution */
  directoryImportMapping?: Record<string, string>;
  /** Directory containing model files for resolving absolute model imports */
  modelSourceDir?: string;
  /** Directory containing mixin files for resolving absolute mixin imports */
  mixinSourceDir?: string;
  /** Project name for classic ember module prefixing */
  projectName: string;
  /** Additional model source patterns and their corresponding directories */
  additionalModelSources?: Array<{ pattern: string; dir: string }>;
  /** Additional mixin source patterns and their corresponding directories */
  additionalMixinSources?: Array<{ pattern: string; dir: string }>;
  /**
   * Specify base import path for new resource type imports
   *
   * If not provided, relative imports will be generated.
   */
  resourcesImport?: string;
  /** Directory to write generated resource schemas to */
  resourcesDir?: string;
  /** Directory to write generated trait files to */
  traitsDir?: string;
  /** Base import path for trait type imports (optional, defaults to relative imports) */
  traitsImport?: string;
  /** Custom type mappings for EmberData transform types (e.g., 'uuid' -> 'string') */
  typeMapping?: Record<string, string>;
  /** Internal flag to indicate we're processing an intermediate model that should become a trait */
  processingIntermediateModel?: boolean;
  /** Input directory for scanning models and mixins (default: './app') */
  inputDir?: string;
  /** Output directory for generated schema files (default: './app/schemas') */
  outputDir?: string;
  /** Configuration for the Store type to include in generated intermediate model traits */
  storeType?: {
    /** Name of the Store type (default: 'Store') */
    name?: string;
    /** Import path for the Store type (e.g., 'my-app/services/store') */
    import: string;
  };
  /** Generate resource schemas for external (non-local) model files */
  generateExternalResources?: boolean;
  /**
   * Allows specifying a 'substitute' for a situation where an import can't be properly analyzed by the codemod.
   * Example being a "BaseModel" whose file can't easily be read. In that situation users are expected to migrate such module manually and
   * provide codemod with information under what extension and trait name it exists now.
   * */
  importSubstitutes?: Array<{
    import: string;
    extension?: string;
    trait?: string;
    sourcePath?: string;
  }>;
}

export interface MigrateOptions extends Partial<TransformOptions> {
  mixinsOnly?: boolean;
  modelsOnly?: boolean;
  skipProcessed?: boolean;
  inputDir?: string;
  modelSourceDir?: string;
  mixinSourceDir?: string;
}

export type FinalOptions = TransformOptions &
  MigrateOptions &
  Required<Pick<TransformOptions, 'modelSourceDir' | 'mixinSourceDir' | 'warpDriveImports' | 'projectName'>> &
  Required<Pick<MigrateOptions, 'inputDir'>> & {
    kind: 'finalized';
    outputDir: string;
  };
