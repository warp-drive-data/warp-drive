import type { connectedMixins, modelToMixinsMap } from './processors/mixin-analyzer';

export interface TransformOptions {
  verbose?: boolean;
  debug?: boolean;
  dryRun?: boolean;
  /** Use @warp-drive-mirror instead of @warp-drive for imports */
  mirror?: boolean;
  /** Test mode - treats all mixins as connected to models (for testing) */
  testMode?: boolean;
  /** Set of absolute file paths for mixins that are connected to models */
  modelConnectedMixins?: connectedMixins;
  modelToMixinsMap?: modelToMixinsMap;
  /** List of all discovered mixin file paths (for polymorphic detection) */
  allMixinFiles?: string[];
  /** List of all discovered model file paths (for resource vs trait detection) */
  allModelFiles?: string[];
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
  /** Additional model source patterns and their corresponding directories */
  additionalModelSources?: Array<{ pattern: string; dir: string }>;
  /** Additional mixin source patterns and their corresponding directories */
  additionalMixinSources?: Array<{ pattern: string; dir: string }>;
  /** Specify base import path for new resource type imports (required) */
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
  /** Set of model base names that have extension files generated (for preferring extension imports) */
  modelsWithExtensions?: Set<string>;
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

export type FinalOptions = TransformOptions & MigrateOptions & { kind: 'finalized' };
