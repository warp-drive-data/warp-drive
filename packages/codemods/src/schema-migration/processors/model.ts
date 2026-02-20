import { parse, type SgNode } from '@ast-grep/napi';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

import type { Filename } from '../codemod.js';
import type { TransformOptions } from '../config.js';
import type { SchemaField, TransformArtifact } from '../utils/ast-utils.js';
import {
  buildLegacySchemaObject,
  buildTraitSchemaObject,
  collectRelationshipImports,
  collectTraitImports,
  convertToSchemaField,
  debugLog,
  DEFAULT_EMBER_DATA_SOURCE,
  errorLog,
  extractBaseName,
  extractPascalCaseName,
  extractTypeFromDeclaration,
  extractTypeFromDecorator,
  extractTypeFromMethod,
  findClassDeclaration,
  findDefaultExport,
  findEmberImportLocalName,
  generateCommonWarpDriveImports,
  generateExportStatement,
  generateMergedSchemaCode,
  getEmberDataImports,
  getExportedIdentifier,
  getFileExtension,
  getLanguageFromPath,
  getMixinImports,
  isModelFile,
  mapFieldsToTypeProperties,
  mixinNameToTraitName,
  parseDecoratorArgumentsWithNodes,
  toPascalCase,
  withTransformWrapper,
} from '../utils/ast-utils.js';
import {
  FILE_EXTENSION_JS,
  FILE_EXTENSION_TS,
  isJavaScriptFileByPath,
  NODE_KIND_ARGUMENTS,
  NODE_KIND_CALL_EXPRESSION,
  NODE_KIND_CLASS_BODY,
  NODE_KIND_CLASS_DECLARATION,
  NODE_KIND_CLASS_HERITAGE,
  NODE_KIND_DECORATOR,
  NODE_KIND_FIELD_DEFINITION,
  NODE_KIND_IDENTIFIER,
  NODE_KIND_IMPORT_CLAUSE,
  NODE_KIND_IMPORT_STATEMENT,
  NODE_KIND_MEMBER_EXPRESSION,
  NODE_KIND_METHOD_DEFINITION,
  NODE_KIND_PROPERTY_IDENTIFIER,
} from '../utils/code-processing.js';
import { appendExtensionSignatureType, createExtensionFromOriginalFile } from '../utils/extension-generation.js';
import type { ParsedFile } from '../utils/file-parser.js';
import { isClassMethodSyntax } from '../utils/file-parser.js';
import { replaceWildcardPattern } from '../utils/path-utils.js';
import {
  MODEL_NAME_SUFFIX_REGEX,
  NAMED_TYPE_IMPORT_REGEX,
  normalizePath,
  pascalToKebab,
  RELATIVE_TYPE_IMPORT_REGEX,
  removeFileExtension,
  removeQuoteChars,
  SCHEMA_SUFFIX_REGEX,
  toKebabCase,
  TRAILING_MODEL_SUFFIX_REGEX,
} from '../utils/string.js';

/** Node types to try when searching for class field definitions */
const FIELD_DEFINITION_NODE_TYPES = [
  NODE_KIND_FIELD_DEFINITION,
  'public_field_definition',
  'class_field',
  'property_signature',
];

/** Method names that should be skipped (typically callback methods) */
const SKIP_METHOD_NAMES = ['after'];

/** Standard WarpDrive model import source */
const WARP_DRIVE_MODEL = '@warp-drive/model';

/** Fragment decorator import source */
const FRAGMENT_DECORATOR_SOURCE = 'ember-data-model-fragments/attributes';

/** Fragment base class import source */
const FRAGMENT_BASE_SOURCE = 'ember-data-model-fragments/fragment';

/** Cache for mixin extension analysis results to avoid re-parsing mixin files */
const mixinExtensionCache = new Map<string, { hasExtension: boolean; extensionName: string | null }>();

/**
 * Get the base EmberData Model properties and methods that should be available on all model types.
 * These are inherited from the Model base class but need to be declared in trait interfaces
 * so TypeScript knows they exist when accessing them in extension code.
 */
function getModelBaseProperties(): Array<{ name: string; type: string; readonly?: boolean }> {
  return [
    // State properties (readonly getters from Model)
    { name: 'isNew', type: 'boolean', readonly: true },
    { name: 'hasDirtyAttributes', type: 'boolean', readonly: true },
    { name: 'isDeleted', type: 'boolean', readonly: true },
    { name: 'isSaving', type: 'boolean', readonly: true },
    { name: 'isValid', type: 'boolean', readonly: true },
    { name: 'isError', type: 'boolean', readonly: true },
    { name: 'isLoaded', type: 'boolean', readonly: true },
    { name: 'isEmpty', type: 'boolean', readonly: true },

    // Lifecycle methods
    { name: 'save', type: '(options?: Record<string, unknown>) => Promise<this>' },
    { name: 'reload', type: '(options?: Record<string, unknown>) => Promise<this>' },
    { name: 'deleteRecord', type: '() => void' },
    { name: 'unloadRecord', type: '() => void' },
    { name: 'destroyRecord', type: '(options?: Record<string, unknown>) => Promise<void>' },
    { name: 'rollbackAttributes', type: '() => void' },

    // Relationship accessor methods
    { name: 'belongsTo', type: '(propertyName: string) => BelongsToReference' },
    { name: 'hasMany', type: '(propertyName: string) => HasManyReference' },

    // Utility methods
    { name: 'serialize', type: '(options?: Record<string, unknown>) => unknown' },

    // Error property
    { name: 'errors', type: 'Errors', readonly: true },

    // Additional state
    { name: 'adapterError', type: 'Error | null', readonly: true },
    { name: 'isReloading', type: 'boolean', readonly: true },
  ];
}

/**
 * Shared result type for model analysis
 */
interface ModelAnalysisResult {
  isValid: boolean;
  modelImportLocal?: string;
  isFragment?: boolean;
  defaultExportNode?: SgNode;
  schemaFields: SchemaField[];
  extensionProperties: Array<{
    name: string;
    originalKey: string;
    value: string;
    typeInfo?: ExtractedType;
    isObjectMethod?: boolean;
  }>;
  mixinTraits: string[];
  mixinExtensions: string[];
  modelName: string;
  baseName: string;
}

/**
 * Type information extracted from AST
 */
interface ExtractedType {
  type: string;
  readonly?: boolean;
  optional?: boolean;
  imports?: string[];
}

/**
 * Get the list of expected model import sources based on options
 */
function getExpectedModelImportSources(options: TransformOptions): string[] {
  return [
    options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    ...(options?.importSubstitutes?.map((s) => s.import) ?? []),
    WARP_DRIVE_MODEL,
    FRAGMENT_DECORATOR_SOURCE,
    FRAGMENT_BASE_SOURCE,
  ].filter(Boolean);
}

/**
 * Create an invalid ModelAnalysisResult with the given model/base name
 */
function createInvalidResult(modelName: string, baseName: string): ModelAnalysisResult {
  return {
    isValid: false,
    modelImportLocal: undefined,
    defaultExportNode: undefined,
    schemaFields: [],
    extensionProperties: [],
    mixinTraits: [],
    mixinExtensions: [],
    modelName,
    baseName,
  };
}

/**
 * Result of AST validation for a model file
 */
interface ModelASTValidation {
  root: SgNode;
  modelImportLocal: string | null;
  fragmentImportLocal: string | null;
  defaultExportNode: SgNode;
  isFragment: boolean;
  emberDataImports: Map<string, string>;
}

/**
 * Validate model AST: parse source, find imports, validate default export, check model class and fragment status.
 * Returns null if the file is not a valid model.
 */
function validateModelAST(filePath: string, source: string, options: TransformOptions): ModelASTValidation | null {
  const lang = getLanguageFromPath(filePath);
  const ast = parse(lang, source);
  const root = ast.root();

  const expectedSources = getExpectedModelImportSources(options);
  const modelImportLocal = findEmberImportLocalName(root, expectedSources, options, filePath, process.cwd());
  debugLog(options, `DEBUG: Model import local: ${modelImportLocal}`);

  const fragmentImportLocal = findEmberImportLocalName(root, [FRAGMENT_BASE_SOURCE], options, filePath, process.cwd());
  debugLog(options, `DEBUG: Fragment import local: ${fragmentImportLocal}`);

  const defaultExportNode = findDefaultExport(root, options);
  debugLog(options, `DEBUG: Default export node: ${defaultExportNode ? 'found' : 'not found'}`);
  if (!defaultExportNode) {
    return null;
  }

  let isValidModel = isModelClass(
    defaultExportNode,
    modelImportLocal ?? undefined,
    fragmentImportLocal ?? undefined,
    root,
    options,
    filePath
  );

  if (!isValidModel && options?.intermediateFragmentPaths && options.intermediateFragmentPaths.length > 0) {
    const intermediateLocalNames = getIntermediateFragmentLocalNames(root, options, filePath);
    for (const localName of intermediateLocalNames) {
      if (isModelClass(defaultExportNode, undefined, localName, root, options, filePath)) {
        isValidModel = true;
        debugLog(options, `DEBUG: Valid model via intermediate fragment path: ${localName}`);
        break;
      }
    }
  }

  debugLog(options, `DEBUG: Is valid model: ${isValidModel}`);
  if (!isValidModel) {
    debugLog(options, 'DEBUG: Not a valid model class, skipping');
    return null;
  }

  let isFragment = false;
  if (fragmentImportLocal) {
    isFragment = isClassExtendingFragment(defaultExportNode, fragmentImportLocal, root, options, filePath);
  }
  if (!isFragment && options?.intermediateFragmentPaths && options.intermediateFragmentPaths.length > 0) {
    const intermediateLocalNames = getIntermediateFragmentLocalNames(root, options, filePath);
    for (const localName of intermediateLocalNames) {
      if (isClassExtendingFragment(defaultExportNode, localName, root, options, filePath)) {
        isFragment = true;
        break;
      }
    }
  }
  debugLog(options, `DEBUG: Is Fragment class: ${isFragment}`);

  const emberDataImports = getEmberDataImports(root, expectedSources, options);

  return {
    root,
    modelImportLocal,
    fragmentImportLocal,
    defaultExportNode,
    isFragment,
    emberDataImports,
  };
}

/**
 * Extract heritage clause info (mixin traits and extensions) from the AST root.
 */
function extractHeritageInfo(
  root: SgNode,
  filePath: string,
  options?: TransformOptions
): { mixinTraits: string[]; mixinExtensions: string[] } {
  const mixinTraits: string[] = [];
  const mixinExtensions: string[] = [];

  const classDeclaration = root.find({ rule: { kind: NODE_KIND_CLASS_DECLARATION } });
  const heritageClause = classDeclaration?.find({ rule: { kind: NODE_KIND_CLASS_HERITAGE } });

  if (heritageClause) {
    const mixinImports = getMixinImports(root, options);
    mixinTraits.push(...extractMixinTraits(heritageClause, root, mixinImports, options));

    const mixinExts = extractMixinExtensions(heritageClause, root, mixinImports, filePath, options);
    mixinExtensions.push(...mixinExts);

    if (options?.intermediateModelPaths && options.intermediateModelPaths.length > 0) {
      const intermediateTraits = extractIntermediateModelTraits(
        heritageClause,
        root,
        options.intermediateModelPaths,
        options
      );
      mixinTraits.push(...intermediateTraits);
    }

    if (options?.importSubstitutes) {
      for (const substitute of options.importSubstitutes) {
        const localName = findEmberImportLocalName(root, [substitute.import], options, undefined, process.cwd());
        if (localName && heritageClause.text().includes(localName)) {
          if (substitute.trait) {
            mixinTraits.push(substitute.trait);
          }
          if (substitute.extension) {
            mixinExtensions.push(substitute.extension);
          }
        }
      }
    }
  }

  return { mixinTraits: [...new Set(mixinTraits)], mixinExtensions };
}

/**
 * Shared function to analyze a model file and extract all necessary information
 */
function analyzeModelFile(filePath: string, source: string, options: TransformOptions): ModelAnalysisResult {
  const modelName = extractPascalCaseName(filePath);
  const baseName = extractBaseName(filePath);

  try {
    const validation = validateModelAST(filePath, source, options);
    if (!validation) {
      return createInvalidResult(modelName, baseName);
    }

    const { root, modelImportLocal, defaultExportNode, isFragment, emberDataImports } = validation;

    // Extract schema fields and extension properties from the class body
    const { schemaFields, extensionProperties } = extractModelFields(root, emberDataImports, filePath, options);

    // Extract heritage info (mixin traits and extensions)
    const { mixinTraits, mixinExtensions } = extractHeritageInfo(root, filePath, options);

    debugLog(
      options,
      `DEBUG: Returning from analyzeModelFile with defaultExportNode: ${defaultExportNode ? 'defined' : 'undefined'}`
    );
    return {
      isValid: true,
      modelImportLocal: modelImportLocal ?? undefined,
      isFragment,
      defaultExportNode,
      schemaFields,
      extensionProperties,
      mixinTraits,
      mixinExtensions,
      modelName,
      baseName,
    };
  } catch (error) {
    debugLog(options, `DEBUG: Error analyzing model file: ${String(error)}`);
    return createInvalidResult(modelName, baseName);
  }
}

/**
 * Transform to convert EmberData models to WarpDrive LegacyResourceSchema patterns
 */
export default function transform(filePath: string, source: string, options: TransformOptions): string {
  return withTransformWrapper(
    filePath,
    source,
    options,
    'model-to-schema',
    (_root, sourceContent, filePathParam, optionsParam) => {
      const analysis = analyzeModelFile(filePathParam, sourceContent, optionsParam);

      if (!analysis.isValid) {
        debugLog(optionsParam, 'Model analysis failed, skipping transform');
        return sourceContent;
      }

      const {
        defaultExportNode,
        schemaFields,
        extensionProperties,
        mixinTraits,
        mixinExtensions,
        modelName,
        baseName,
      } = analysis;

      debugLog(
        optionsParam,
        `Found ${schemaFields.length} schema fields and ${extensionProperties.length} extension properties`
      );

      // Transform relative model imports to schema type imports first
      const transformedSource = transformModelImportsInSource(sourceContent, _root);

      // Generate the replacement schema
      const replacement = generateLegacyResourceSchema(
        modelName,
        baseName,
        schemaFields,
        mixinTraits,
        mixinExtensions,
        extensionProperties,
        transformedSource
      );

      if (!defaultExportNode) {
        return transformedSource;
      }

      const original = defaultExportNode.text();
      return transformedSource.replace(original, replacement);
    }
  );
}

/**
 * Resolve import path using additionalModelSources and additionalMixinSources patterns
 */
function resolveIntermediateImportPath(
  importPath: string,
  additionalModelSources: Array<{ pattern: string; dir: string }> | undefined,
  additionalMixinSources: Array<{ pattern: string; dir: string }> | undefined
): string {
  // Try additionalModelSources first
  if (additionalModelSources) {
    for (const source of additionalModelSources) {
      const replacement = replaceWildcardPattern(source.pattern, importPath, source.dir);
      if (replacement) {
        // Remove trailing wildcard from replacement to get base path
        return replacement.replace(/\/?\*+$/, '');
      }
    }
  }

  // Try additionalMixinSources
  if (additionalMixinSources) {
    for (const source of additionalMixinSources) {
      const replacement = replaceWildcardPattern(source.pattern, importPath, source.dir);
      if (replacement) {
        // Remove trailing wildcard from replacement to get base path
        return replacement.replace(/\/?\*+$/, '');
      }
    }
  }

  // If no pattern matches, return the original path unchanged
  return importPath;
}

/**
 * Process intermediate models to generate trait artifacts
 * This should be called before processing regular models that extend these intermediate models
 * Models are processed in dependency order to ensure base traits exist before dependent traits
 */
export function processIntermediateModelsToTraits(
  intermediateModelPaths: string[],
  additionalModelSources: Array<{ pattern: string; dir: string }> | undefined,
  additionalMixinSources: Array<{ pattern: string; dir: string }> | undefined,
  options: TransformOptions
): { artifacts: TransformArtifact[]; errors: string[] } {
  const artifacts: TransformArtifact[] = [];
  const errors: string[] = [];

  // First, load all intermediate models and analyze their dependencies
  const modelInfoMap = new Map<
    string,
    {
      filePath: string;
      source: string;
      dependencies: string[];
      processed: boolean;
    }
  >();

  for (const modelPath of intermediateModelPaths) {
    // Convert import path to file system path using additionalModelSources and additionalMixinSources
    const relativePath = resolveIntermediateImportPath(
      modelPath,
      additionalModelSources || [],
      additionalMixinSources || []
    );
    debugLog(options, `Resolved intermediate model path ${modelPath} to: ${relativePath}`);
    const possiblePaths = [`${relativePath}.ts`, `${relativePath}.js`];

    let filePath: string | null = null;
    let source: string | null = null;

    debugLog(options, `Checking intermediate model paths for ${modelPath}: ${possiblePaths.join(', ')}`);
    for (const possiblePath of possiblePaths) {
      try {
        if (existsSync(possiblePath)) {
          filePath = possiblePath;
          source = readFileSync(possiblePath, 'utf-8');
          debugLog(options, `Found intermediate model file: ${possiblePath}`);
          break;
        }
      } catch (error) {
        debugLog(options, `Could not read ${possiblePath}: ${String(error)}`);
      }
    }

    if (!filePath || !source) {
      errors.push(`Could not find or read intermediate model file for path: ${modelPath}`);
      continue;
    }

    // Analyze dependencies (which other intermediate models this one extends)
    const dependencies: string[] = [];
    for (const otherPath of intermediateModelPaths) {
      if (otherPath !== modelPath && source.includes(`from '${otherPath}'`)) {
        dependencies.push(otherPath);
      }
    }

    modelInfoMap.set(modelPath, {
      filePath,
      source,
      dependencies,
      processed: false,
    });
  }

  // Process models in dependency order using a simple topological sort
  function processModel(modelPath: string): void {
    const modelInfo = modelInfoMap.get(modelPath);
    if (!modelInfo || modelInfo.processed) {
      return;
    }

    // First process dependencies
    for (const dep of modelInfo.dependencies) {
      processModel(dep);
    }

    // Now process this model
    try {
      debugLog(options, `Processing intermediate model: ${modelPath}`);

      // Process the intermediate model to generate trait artifacts
      const traitArtifacts = generateIntermediateModelTraitArtifacts(
        modelInfo.filePath,
        modelInfo.source,
        modelPath,
        options
      );

      // If we have a traitsDir or resourcesDir, write the artifacts immediately so subsequent models can reference them
      // Extensions are now co-located with their schemas
      if ((options.traitsDir || options.resourcesDir) && !options.dryRun) {
        for (const artifact of traitArtifacts) {
          let baseDir: string | undefined;

          if (
            (artifact.type === 'trait' || artifact.type === 'trait-type' || artifact.type === 'trait-extension') &&
            options.traitsDir
          ) {
            baseDir = options.traitsDir;
          } else if (
            (artifact.type === 'resource-extension' ||
              artifact.type === 'extension' ||
              artifact.type === 'extension-type') &&
            options.resourcesDir
          ) {
            // Extensions are now co-located with resources
            baseDir = options.resourcesDir;
          }

          if (baseDir) {
            const artifactPath = join(baseDir, artifact.suggestedFileName);
            // Ensure directory exists
            mkdirSync(dirname(artifactPath), { recursive: true });
            // Write the file
            writeFileSync(artifactPath, artifact.code, 'utf-8');
            debugLog(options, `Wrote ${artifact.type}: ${artifactPath}`);
          }
        }
      }

      artifacts.push(...traitArtifacts);
      debugLog(options, `Generated ${traitArtifacts.length} artifacts for ${modelPath}`);
    } catch (error) {
      errors.push(`Error processing intermediate model ${modelPath}: ${String(error)}`);
    }

    modelInfo.processed = true;
  }

  // Process all models
  for (const modelPath of intermediateModelPaths) {
    processModel(modelPath);
  }

  return { artifacts, errors };
}

/**
 * Produce zero, one, or more artifacts for a given model file:
 * - Schema artifact when attr/hasMany/belongsTo fields are present
 * - Extension artifact when non-schema properties (methods, computeds) are present
 * - Type artifacts for schema, extension, and trait interfaces
 *
 * This does not modify the original source. The CLI can use this to write
 * files to the requested output directories.
 */

/**
 * Generate artifacts for regular models (both internal and external)
 */
function generateRegularModelArtifacts(
  filePath: string,
  source: string,
  analysis: ModelAnalysisResult,
  options: TransformOptions
): TransformArtifact[] {
  const { schemaFields, extensionProperties, mixinTraits, mixinExtensions, modelName, baseName, isFragment } = analysis;
  const artifacts: TransformArtifact[] = [];

  // Determine the file extension based on the original model file
  const originalExtension = getFileExtension(filePath);
  const isTypeScript = originalExtension === '.ts';

  // Collect imports needed for schema interface
  const schemaImports = new Set<string>();

  // Collect schema field types - start with [Type] symbol
  const schemaFieldTypes = [
    {
      name: '[Type]',
      type: `'${toKebabCase(baseName)}'`,
      readonly: true,
    },
    ...mapFieldsToTypeProperties(schemaFields, options),
  ];

  const commonImports = generateCommonWarpDriveImports(options);
  schemaImports.add(commonImports.typeImport);
  collectRelationshipImports(schemaFields, baseName, schemaImports, options);
  collectTraitImports(mixinTraits, schemaImports, options);

  // Build the schema object
  const schemaName = `${modelName}Schema`;
  const schemaObject = buildLegacySchemaObject(baseName, schemaFields, mixinTraits, mixinExtensions, isFragment);

  // Generate merged schema code (schema + types in one file)
  const mergedSchemaCode = generateMergedSchemaCode({
    baseName,
    interfaceName: modelName,
    schemaName,
    schemaObject,
    properties: schemaFieldTypes,
    traits: mixinTraits,
    imports: schemaImports,
    isTypeScript,
    options,
  });

  artifacts.push({
    type: 'schema',
    name: schemaName,
    code: mergedSchemaCode,
    suggestedFileName: `${baseName}.schema${originalExtension}`,
  });

  // Create extension artifact preserving original file content
  const modelInterfaceName = modelName;
  const modelImportPath = options?.resourcesImport
    ? `${options.resourcesImport}/${baseName}.schema`
    : `../resources/${baseName}.schema`;
  const extensionArtifact = createExtensionFromOriginalFile(
    filePath,
    source,
    baseName,
    `${modelName}Extension`,
    extensionProperties,
    options,
    modelInterfaceName,
    modelImportPath,
    'model',
    undefined,
    'resource'
  );

  debugLog(options, `Extension artifact created: ${!!extensionArtifact}`);
  if (extensionArtifact) {
    artifacts.push(extensionArtifact);
  }

  // Create extension signature type alias if there are extension properties
  debugLog(
    options,
    `Extension properties length: ${extensionProperties.length}, extensionArtifact exists: ${!!extensionArtifact}`
  );
  debugLog(options, `Extension properties: ${JSON.stringify(extensionProperties.map((p) => p.name))}`);
  if (extensionProperties.length > 0 && extensionArtifact) {
    appendExtensionSignatureType(extensionArtifact, modelName);
  }

  return artifacts;
}

export function toArtifacts(parsedFile: ParsedFile, options: TransformOptions): TransformArtifact[] {
  debugLog(options, `=== DEBUG: Processing ${parsedFile.path} ===`);

  const analysis = analyzeModelFromParsed(parsedFile, options);
  if (!analysis.isValid) {
    debugLog(options, 'Model analysis failed, skipping artifact generation');
    return [];
  }
  return generateRegularModelArtifacts(parsedFile.path, parsedFile.source, analysis, options);
}

/**
 * Analyze a model using pre-parsed data for fields and behaviors.
 * Still uses AST for validation (isModelClass, isFragment, intermediate models)
 * and mixin trait/extension extraction from heritage clause.
 */
function analyzeModelFromParsed(parsedFile: ParsedFile, options: TransformOptions): ModelAnalysisResult {
  const filePath = parsedFile.path;
  const modelName = parsedFile.pascalName;
  const baseName = parsedFile.baseName;

  try {
    const validation = validateModelAST(filePath, parsedFile.source, options);
    if (!validation) {
      return createInvalidResult(modelName, baseName);
    }

    const { root, modelImportLocal, defaultExportNode, isFragment } = validation;

    // Use pre-parsed data for fields and behaviors
    const schemaFields: SchemaField[] = parsedFile.fields.map((f) => ({
      name: f.name,
      kind: f.kind,
      type: f.type,
      options: f.options,
    }));

    const extensionProperties = parsedFile.behaviors
      .filter((b) => !SKIP_METHOD_NAMES.includes(b.name))
      .map((b) => ({
        name: b.name,
        originalKey: b.originalKey,
        value: b.value,
        typeInfo: b.typeInfo,
        isObjectMethod: b.isObjectMethod,
      }));

    // Extract heritage info (mixin traits and extensions)
    const { mixinTraits, mixinExtensions } = extractHeritageInfo(root, filePath, options);

    return {
      isValid: true,
      modelImportLocal: modelImportLocal ?? undefined,
      isFragment,
      defaultExportNode,
      schemaFields,
      extensionProperties,
      mixinTraits,
      mixinExtensions,
      modelName,
      baseName,
    };
  } catch (error) {
    debugLog(options, `Error analyzing parsed model: ${String(error)}`);
    return createInvalidResult(modelName, baseName);
  }
}

/**
 * Get the local names of EmberData decorators imported from valid sources
 */

/**
 * Generate trait artifacts for intermediate models (like DataFieldModel)
 * These become traits that other models can include
 */
function generateIntermediateModelTraitArtifacts(
  filePath: string,
  source: string,
  modelPath: string,
  options: TransformOptions
): TransformArtifact[] {
  const artifacts: TransformArtifact[] = [];

  // Extract the trait name from the model path
  // e.g., "my-app/core/data-field-model" -> "data-field"
  const traitBaseName = modelPath.split('/').pop()?.replace(MODEL_NAME_SUFFIX_REGEX, '') || modelPath;
  const traitName = pascalToKebab(traitBaseName);

  const traitPascalName = toPascalCase(traitName);

  // Analyze the intermediate model file to extract fields
  const analysis = analyzeModelFile(filePath, source, options);

  if (!analysis.isValid) {
    debugLog(options, `Intermediate model ${modelPath} analysis failed, skipping trait generation`);
    return [];
  }

  const { schemaFields, extensionProperties, mixinTraits } = analysis;

  // Determine the file extension based on the original model file
  const originalExtension = getFileExtension(filePath);
  const isTypeScript = originalExtension === '.ts';

  // Generate trait type interface
  const traitFieldTypes = mapFieldsToTypeProperties(schemaFields, options);

  // For intermediate model traits, we need to add the `id` property from the Model base class
  // to the type chain. We add this to all traits since it's inherited from Model.
  // Only add if not already present from schema fields
  const hasId = traitFieldTypes.some((f) => f.name === 'id');

  if (!hasId) {
    // Add id property at the beginning - all EmberData records have id
    traitFieldTypes.unshift({
      name: 'id',
      type: 'string | null',
      readonly: false, // id can be set on new records
    });
    debugLog(options, `DEBUG: Added id property to ${traitName} trait`);
  }

  // Add `store` property if storeType is configured
  // The Store type is application-specific, so it must be explicitly configured
  const hasStore = traitFieldTypes.some((f) => f.name === 'store');

  if (!hasStore && options?.storeType) {
    const storeTypeName = options.storeType.name || 'Store';
    traitFieldTypes.push({
      name: 'store',
      type: storeTypeName,
      readonly: true, // store is injected and should not be modified
    });
    debugLog(options, `DEBUG: Added store property with type ${storeTypeName} to ${traitName} trait`);
  }

  // Add Model base properties (isNew, save, belongsTo, etc.) to trait types
  // These are inherited from EmberData Model but need to be declared for TypeScript
  const modelBaseProperties = getModelBaseProperties();
  for (const prop of modelBaseProperties) {
    // Only add if not already present (avoid duplicates)
    const exists = traitFieldTypes.some((f) => f.name === prop.name);
    if (!exists) {
      traitFieldTypes.push({
        name: prop.name,
        type: prop.type,
        readonly: prop.readonly ?? false,
      });
    }
  }
  debugLog(options, `DEBUG: Added ${modelBaseProperties.length} Model base properties to ${traitName} trait`);

  // Collect imports for trait interface
  const traitImports = new Set<string>();

  // Add imports for Model base property types (BelongsToReference, HasManyReference, Errors)
  traitImports.add(`type { BelongsToReference, HasManyReference, Errors } from '@warp-drive/legacy/model/-private'`);
  collectRelationshipImports(schemaFields, traitName, traitImports, options);
  collectTraitImports(mixinTraits, traitImports, options, true);

  // Add Store type import if storeType is configured
  if (options?.storeType) {
    const storeTypeName = options.storeType.name || 'Store';
    const storeImport = `type { ${storeTypeName} } from '${options.storeType.import}'`;
    traitImports.add(storeImport);
    debugLog(options, `DEBUG: Added Store type import: ${storeImport}`);
  }

  // Build the trait schema object
  const traitSchemaName = `${traitPascalName}Trait`;
  const traitSchemaObject = buildTraitSchemaObject(schemaFields, mixinTraits, { legacyFieldOrder: true });

  // Generate merged trait schema code (schema + types in one file)
  const mergedTraitSchemaCode = generateMergedSchemaCode({
    baseName: traitName,
    interfaceName: traitSchemaName,
    schemaName: traitSchemaName,
    schemaObject: traitSchemaObject,
    properties: traitFieldTypes,
    traits: mixinTraits,
    imports: traitImports,
    isTypeScript,
  });

  artifacts.push({
    type: 'trait',
    name: traitSchemaName,
    code: mergedTraitSchemaCode,
    suggestedFileName: `${traitName}.schema${originalExtension}`,
  });

  // For traits with extension properties, create extension artifact
  if (extensionProperties.length > 0) {
    // Create the extension artifact preserving original file content
    // For traits, extensions should extend the trait interface
    const traitInterfaceName = traitPascalName;
    const traitImportPath = options?.traitsImport
      ? `${options.traitsImport}/${traitName}.schema`
      : `../traits/${traitName}.schema`;
    const extensionArtifact = createExtensionFromOriginalFile(
      filePath,
      source,
      traitName,
      `${traitPascalName}Extension`,
      extensionProperties,
      options,
      traitInterfaceName,
      traitImportPath,
      'model',
      undefined,
      'trait'
    );
    if (extensionArtifact) {
      artifacts.push(extensionArtifact);

      // Create extension signature type alias if there are extension properties
      appendExtensionSignatureType(extensionArtifact, traitPascalName);
    }
  }

  return artifacts;
}

/**
 * Get local import names for intermediate model classes
 */
function getIntermediateModelLocalNames(
  root: SgNode,
  intermediateModelPaths: string[],
  options?: TransformOptions,
  fromFile?: string
): string[] {
  const localNames: string[] = [];

  for (const modelPath of intermediateModelPaths) {
    // First try direct matching
    let localName = findEmberImportLocalName(root, [modelPath], options, fromFile, process.cwd());

    // If no direct match, try to find imports that resolve to the expected intermediate model
    // This handles cases where the configured path doesn't match the actual import path
    if (!localName && fromFile && options?.intermediateModelPaths?.includes(modelPath)) {
      const importStatements = root.findAll({ rule: { kind: NODE_KIND_IMPORT_STATEMENT } });

      for (const importNode of importStatements) {
        const source = importNode.field('source');
        if (!source) continue;

        const sourceText = removeQuoteChars(source.text());

        // Check if this is a relative import that could be our intermediate model
        if (sourceText.startsWith('./') || sourceText.startsWith('../')) {
          try {
            // Use the same path resolution logic as in the isModelFile fix
            const resolvedPath = resolve(dirname(fromFile), sourceText);

            // Check if the resolved path corresponds to the configured intermediate model path
            // by checking if it ends with the same pattern as the configured path
            const expectedFilePath = modelPath.split('/').slice(-1)[0]; // e.g., "-auditboard-model"
            const possiblePaths = [
              `${resolvedPath}${FILE_EXTENSION_TS}`,
              `${resolvedPath}${FILE_EXTENSION_JS}`,
              resolvedPath,
            ];

            for (const possiblePath of possiblePaths) {
              if (existsSync(possiblePath)) {
                // Check if this resolved path matches the expected intermediate model
                if (possiblePath.includes(expectedFilePath)) {
                  try {
                    const content = readFileSync(possiblePath, 'utf8');
                    // Verify it's actually a model file
                    const isModel = isModelFile(possiblePath, content, options);
                    if (isModel) {
                      const importClause = importNode
                        .children()
                        .find((child) => child.kind() === NODE_KIND_IMPORT_CLAUSE);
                      if (importClause) {
                        const identifiers = importClause.findAll({ rule: { kind: NODE_KIND_IDENTIFIER } });
                        if (identifiers.length > 0) {
                          localName = identifiers[0].text();
                          break;
                        }
                      }
                    }
                  } catch {
                    // Continue checking other possibilities
                  }
                }
                break;
              }
            }

            if (localName) break;
          } catch {
            // Continue checking other imports
          }
        }
      }
    }

    if (localName) {
      localNames.push(localName);
      debugLog(options, `DEBUG: Found intermediate model local name: ${localName} for path: ${modelPath}`);
    }
  }

  return localNames;
}

/**
 * Get local names for intermediate fragment imports in the current file
 */
function getIntermediateFragmentLocalNames(root: SgNode, options: TransformOptions, fromFile: string): string[] {
  const localNames: string[] = [];
  const intermediateFragmentPaths = options.intermediateFragmentPaths || [];

  for (const fragmentPath of intermediateFragmentPaths) {
    // First try direct matching
    let localName = findEmberImportLocalName(root, [fragmentPath], options, fromFile, process.cwd());

    // If no direct match, try to find imports that match the configured path
    if (!localName) {
      const importStatements = root.findAll({ rule: { kind: NODE_KIND_IMPORT_STATEMENT } });

      for (const importNode of importStatements) {
        const source = importNode.field('source');
        if (!source) continue;

        const sourceText = removeQuoteChars(source.text());

        // Normalize both paths for comparison
        const normalizedFragmentPath = normalizePath(fragmentPath);
        const normalizedSourceText = normalizePath(sourceText);

        // Check for direct module path match (e.g., 'codemod/models/base-fragment')
        if (normalizedSourceText === normalizedFragmentPath) {
          const importClause = importNode.children().find((child) => child.kind() === NODE_KIND_IMPORT_CLAUSE);
          if (importClause) {
            const identifiers = importClause.findAll({ rule: { kind: NODE_KIND_IDENTIFIER } });
            if (identifiers.length > 0) {
              localName = identifiers[0].text();
              debugLog(
                options,
                `DEBUG: Matched intermediate fragment (direct): ${sourceText} for config: ${fragmentPath}`
              );
              break;
            }
          }
        }

        // Check if this is a relative import that could be our intermediate fragment
        if (sourceText.startsWith('./') || sourceText.startsWith('../')) {
          try {
            const resolvedPath = resolve(dirname(fromFile), sourceText);

            // Normalize the configured path to check against
            // fragmentPath could be like "codemod/models/base-fragment" or "app/fragments/base-fragment"
            // We need to check if the resolved path ends with this pattern
            const pathSegments = normalizedFragmentPath.split('/');

            // Check if resolved path ends with the configured path segments
            const possiblePaths = [
              `${resolvedPath}${FILE_EXTENSION_TS}`,
              `${resolvedPath}${FILE_EXTENSION_JS}`,
              resolvedPath,
            ];

            for (const possiblePath of possiblePaths) {
              if (existsSync(possiblePath)) {
                const normalizedPossiblePath = normalizePath(possiblePath);

                // Check if the resolved path ends with the configured fragment path
                // or contains all the path segments in order
                let matches = false;

                // Method 1: Check if it ends with the full path
                if (
                  normalizedPossiblePath.endsWith(normalizedFragmentPath) ||
                  normalizedPossiblePath.endsWith(`${normalizedFragmentPath}${FILE_EXTENSION_TS}`) ||
                  normalizedPossiblePath.endsWith(`${normalizedFragmentPath}${FILE_EXTENSION_JS}`)
                ) {
                  matches = true;
                }

                // Method 2: Check if all path segments appear in order
                if (!matches && pathSegments.length > 0) {
                  const possiblePathParts = normalizedPossiblePath.split('/');
                  let segmentIndex = 0;

                  for (let i = possiblePathParts.length - 1; i >= 0 && segmentIndex < pathSegments.length; i--) {
                    const part = removeFileExtension(possiblePathParts[i]);
                    const expectedSegment = pathSegments[pathSegments.length - 1 - segmentIndex];

                    if (part === expectedSegment) {
                      segmentIndex++;
                    } else if (segmentIndex > 0) {
                      // If we've already started matching but this doesn't match, reset
                      break;
                    }
                  }

                  matches = segmentIndex === pathSegments.length;
                }

                if (matches) {
                  const importClause = importNode.children().find((child) => child.kind() === NODE_KIND_IMPORT_CLAUSE);
                  if (importClause) {
                    const identifiers = importClause.findAll({ rule: { kind: NODE_KIND_IDENTIFIER } });
                    if (identifiers.length > 0) {
                      localName = identifiers[0].text();
                      debugLog(
                        options,
                        `DEBUG: Matched intermediate fragment (relative): ${sourceText} -> ${possiblePath} for config: ${fragmentPath}`
                      );
                      break;
                    }
                  }
                }
                break;
              }
            }

            if (localName) break;
          } catch (error: unknown) {
            debugLog(options, `DEBUG: Error resolving intermediate fragment path: ${String(error)}`);
          }
        }
      }
    }

    if (localName) {
      localNames.push(localName);
      debugLog(options, `DEBUG: Found intermediate fragment local name: ${localName} for path: ${fragmentPath}`);
    }
  }

  return localNames;
}

/**
 * Check if a class extends Fragment (including intermediate fragment paths)
 */
function isClassExtendingFragment(
  exportNode: SgNode,
  fragmentLocalName: string,
  root: SgNode,
  options?: TransformOptions,
  filePath?: string
): boolean {
  // Look for a class declaration in the export
  let classDeclaration = exportNode.find({ rule: { kind: NODE_KIND_CLASS_DECLARATION } });

  // If no class declaration found in export, check if export references a class by name
  if (!classDeclaration) {
    const exportedIdentifier = getExportedIdentifier(exportNode, undefined);
    if (exportedIdentifier) {
      classDeclaration = root.find({
        rule: {
          kind: NODE_KIND_CLASS_DECLARATION,
          has: {
            kind: NODE_KIND_IDENTIFIER,
            regex: exportedIdentifier,
          },
        },
      });
    }
  }

  if (!classDeclaration) {
    return false;
  }

  // Check if the class has a heritage clause (extends)
  const heritageClause = classDeclaration.find({ rule: { kind: NODE_KIND_CLASS_HERITAGE } });
  if (!heritageClause) {
    return false;
  }

  // Check if it extends the Fragment local name
  const extendsText = heritageClause.text();
  const extendsFragmentDirectly =
    extendsText.includes(fragmentLocalName) || extendsText.includes(`${fragmentLocalName}.extend(`);

  if (extendsFragmentDirectly) {
    return true;
  }

  // Check if it extends an intermediate fragment path
  if (options?.intermediateFragmentPaths && filePath) {
    const intermediateLocalNames = getIntermediateFragmentLocalNames(root, options, filePath);
    for (const localName of intermediateLocalNames) {
      if (extendsText.includes(localName) || extendsText.includes(`${localName}.extend(`)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if the heritage clause extends a specific local name (either directly or via .extend())
 */
function extendsLocalName(extendsText: string, localName: string): boolean {
  return extendsText.includes(localName) || extendsText.includes(`${localName}.extend(`);
}

/**
 * Check if a default export is a class extending a Model or Fragment
 */
function isModelClass(
  exportNode: SgNode,
  modelLocalName: string | undefined,
  fragmentOrBaseModelLocalName: string | undefined,
  root: SgNode,
  options?: TransformOptions,
  filePath?: string
): boolean {
  debugLog(
    options,
    `DEBUG: Checking if export extends model '${modelLocalName}' or fragment/base model '${fragmentOrBaseModelLocalName}'`
  );

  const classDeclaration = findClassDeclaration(exportNode, root, options);

  if (!classDeclaration) {
    debugLog(options, 'DEBUG: No class declaration found in export or by name');
    return false;
  }

  debugLog(options, `DEBUG: Found class declaration: ${classDeclaration.text().slice(0, 100)}...`);
  debugLog(
    options,
    `DEBUG: Class children: ${classDeclaration
      .children()
      .map((c) => `${c.kind()}:${c.text().slice(0, 20)}`)
      .join(', ')}`
  );

  // Check if the class has a heritage clause (extends)
  const heritageClause = classDeclaration.find({ rule: { kind: NODE_KIND_CLASS_HERITAGE } });
  if (!heritageClause) {
    debugLog(options, 'DEBUG: No class_heritage found in class');
    return false;
  }

  // Check if it extends our model local name or calls .extend() on it
  const extendsText = heritageClause.text();
  debugLog(options, `DEBUG: Heritage clause: ${extendsText}`);

  // Check for direct Model extension
  const isDirectExtension = modelLocalName ? extendsLocalName(extendsText, modelLocalName) : false;

  // Check for custom base model or Fragment extension
  const isBaseModelExtension = fragmentOrBaseModelLocalName
    ? extendsLocalName(extendsText, fragmentOrBaseModelLocalName)
    : false;

  // Check for chained extends through configured intermediate classes
  let isChainedExtension = false;
  if (options?.intermediateModelPaths && options.intermediateModelPaths.length > 0) {
    const intermediateLocalNames = getIntermediateModelLocalNames(
      root,
      options.intermediateModelPaths,
      options,
      filePath
    );
    isChainedExtension = intermediateLocalNames.some((localName) => extendsText.includes(localName));
    if (isChainedExtension) {
      debugLog(
        options,
        `DEBUG: Found chained extension through intermediate model: ${intermediateLocalNames.find((name) => extendsText.includes(name))}`
      );
    }
  }

  debugLog(
    options,
    `DEBUG: Direct extension: ${isDirectExtension}, Base model extension: ${isBaseModelExtension}, Chained extension: ${isChainedExtension}`
  );

  return isDirectExtension || isBaseModelExtension || isChainedExtension;
}

/**
 * Check if a method should be skipped based on its name
 */
function shouldSkipMethod(methodName: string): boolean {
  return SKIP_METHOD_NAMES.includes(methodName);
}

/**
 * Find property definitions in the class body by trying different AST node types
 */
function findPropertyDefinitions(classBody: SgNode, options?: TransformOptions): SgNode[] {
  for (const nodeType of FIELD_DEFINITION_NODE_TYPES) {
    try {
      const propertyDefinitions = classBody.findAll({ rule: { kind: nodeType } });
      if (propertyDefinitions.length > 0) {
        debugLog(options, `DEBUG: Found ${propertyDefinitions.length} properties using node type: ${nodeType}`);
        return propertyDefinitions;
      }
    } catch {
      // Node type not supported in this AST, continue to next
      debugLog(options, `DEBUG: Node type ${nodeType} not supported, trying next...`);
    }
  }
  return [];
}

/**
 * Find method definitions in the class body, excluding callback methods
 */
function findMethodDefinitions(classBody: SgNode): SgNode[] {
  return classBody.children().filter((child) => {
    if (child.kind() !== NODE_KIND_METHOD_DEFINITION) {
      return false;
    }

    // Check if this is likely a callback method from a memberAction call
    const nameNode = child.field('name');
    const methodName = nameNode?.text() || '';

    return !shouldSkipMethod(methodName);
  });
}

/**
 * Extract fields that can become schema fields (attr, hasMany, belongsTo)
 * and other properties that need to become extensions
 */
function extractModelFields(
  root: SgNode,
  emberDataImports: Map<string, string>,
  filePath: string,
  options?: TransformOptions
): {
  schemaFields: SchemaField[];
  extensionProperties: Array<{
    name: string;
    originalKey: string;
    value: string;
    typeInfo?: ExtractedType;
    isObjectMethod?: boolean;
  }>;
} {
  const schemaFields: SchemaField[] = [];
  const extensionProperties: Array<{
    name: string;
    originalKey: string;
    value: string;
    typeInfo?: ExtractedType;
    isObjectMethod?: boolean;
  }> = [];

  // Check if this is a JavaScript file - skip type extraction for JS files
  const isJavaScriptFile = isJavaScriptFileByPath(filePath);

  // Find the class declaration
  const classDeclaration = root.find({ rule: { kind: NODE_KIND_CLASS_DECLARATION } });
  if (!classDeclaration) {
    debugLog(options, 'DEBUG: No class declaration found in extractModelFields');
    return { schemaFields, extensionProperties };
  }
  debugLog(options, 'DEBUG: Found class declaration in extractModelFields');

  // Get the class body
  const classBody = classDeclaration.find({ rule: { kind: NODE_KIND_CLASS_BODY } });
  if (!classBody) {
    debugLog(options, 'DEBUG: No class body found');
    return { schemaFields, extensionProperties };
  }
  debugLog(options, 'DEBUG: Found class body, looking for properties...');

  // Get all property definitions within the class body
  let propertyDefinitions: SgNode[] = [];
  let methodDefinitions: SgNode[] = [];

  try {
    // First, let's see what node types are actually available in TypeScript
    if (options?.debug) {
      const allChildren = classBody.children();
      const nodeTypes = allChildren.map((child) => child.kind()).join(', ');
      debugLog(options, `DEBUG: All class body node types: ${nodeTypes}`);
    }

    // Try different possible AST node types for class fields with error handling
    propertyDefinitions = findPropertyDefinitions(classBody, options);

    // Only get method definitions that are direct children of the class body
    // This prevents extracting methods from nested object literals (like memberAction calls)
    methodDefinitions = findMethodDefinitions(classBody);

    debugLog(options, `DEBUG: Found ${propertyDefinitions.length} properties and ${methodDefinitions.length} methods`);
    debugLog(options, `DEBUG: Class body text: ${classBody.text().substring(0, 200)}...`);
    // List all child node types in the class body
    const childTypes = classBody
      .children()
      .map((child) => child.kind())
      .join(', ');
    debugLog(options, `DEBUG: Class body child types: ${childTypes}`);
  } catch (error) {
    errorLog(options, `DEBUG: Error finding properties: ${String(error)}`);
    return { schemaFields, extensionProperties };
  }

  // Process property definitions
  for (const property of propertyDefinitions) {
    // For field_definition nodes, the name is in a property_identifier child
    // We want the LAST property_identifier, as the first ones might be from decorator arguments
    const nameNodes = property.findAll({ rule: { kind: NODE_KIND_PROPERTY_IDENTIFIER } });
    const nameNode = nameNodes[nameNodes.length - 1]; // Get the last one

    if (!nameNode) {
      continue;
    }

    const fieldName = nameNode.text();
    const originalKey = fieldName;

    // Extract TypeScript type information (skip for JavaScript files)
    let typeInfo: ExtractedType | undefined;
    if (!isJavaScriptFile) {
      try {
        typeInfo = extractTypeFromDeclaration(property, options) ?? undefined;
      } catch (error) {
        debugLog(options, `DEBUG: Error extracting type for ${fieldName}: ${String(error)}`);
      }
    }

    // Check if this property has a decorator
    const decorators = property.findAll({ rule: { kind: NODE_KIND_DECORATOR } });
    let isSchemaField = false;

    for (const decorator of decorators) {
      // Extract just the decorator name (before any parentheses or generics)
      const decoratorText = decorator.text().replace('@', '');
      // Split by '(' first to get the part before arguments, then by '<' to remove generics
      const decoratorName = decoratorText.split('(')[0].split('<')[0];

      if (!decoratorName) continue;

      // Check if this is an EmberData decorator
      if (emberDataImports.has(decoratorName)) {
        const originalDecoratorName = emberDataImports.get(decoratorName);
        if (!originalDecoratorName) continue;

        // Parse the decorator arguments if present
        const decoratorArgs = parseDecoratorArgumentsWithNodes(decorator);

        // Extract type from decorator if we don't have explicit type annotation
        if (!typeInfo) {
          try {
            typeInfo = extractTypeFromDecorator(originalDecoratorName, decoratorArgs, options) ?? undefined;
          } catch (error) {
            debugLog(options, `DEBUG: Error extracting type from decorator for ${fieldName}: ${String(error)}`);
          }
        }

        const schemaField = convertToSchemaField(fieldName, originalDecoratorName, decoratorArgs);
        if (schemaField) {
          schemaFields.push(schemaField);
          isSchemaField = true;
          break;
        }
      }
    }

    // If it's not a schema field, add it as an extension property
    if (!isSchemaField) {
      // For field declarations without initializers, we use the whole field definition as the value
      const propertyText = property.text();

      extensionProperties.push({
        name: fieldName,
        originalKey,
        value: propertyText,
        typeInfo,
        isObjectMethod: isClassMethodSyntax(property),
      });
    }
  }

  // Process method definitions (always extension properties)
  for (const method of methodDefinitions) {
    const nameNode = method.field('name');
    if (!nameNode) continue;

    const methodName = nameNode.text();
    debugLog(options, `DEBUG: Processing method: ${methodName}, parent: ${method.parent()?.kind()}`);
    debugLog(options, `DEBUG: Method full text: ${method.text().substring(0, 200)}...`);

    // Since we're only iterating over direct children of classBody,
    // all methods here are guaranteed to be top-level class methods

    // Find any decorators that come before this method
    const decorators: string[] = [];
    const siblings = method.parent()?.children() ?? [];
    const methodIndex = siblings.indexOf(method);

    // Look backwards from the method to find decorators
    for (let i = methodIndex - 1; i >= 0; i--) {
      const sibling = siblings[i];
      if (!sibling) continue;

      if (sibling.kind() === NODE_KIND_DECORATOR) {
        decorators.unshift(sibling.text()); // Add to beginning to maintain order
      } else if (sibling.text().trim() !== '') {
        // Stop at non-empty, non-decorator content
        break;
      }
    }

    // Combine decorators with method text
    const methodText = decorators.length > 0 ? decorators.join('\n') + '\n' + method.text() : method.text();

    // Extract TypeScript type information from method (skip for JavaScript files)
    let typeInfo: ExtractedType | undefined;
    if (!isJavaScriptFile) {
      try {
        typeInfo = extractTypeFromMethod(method, options) ?? undefined;
      } catch (error) {
        debugLog(options, `DEBUG: Error extracting type for method ${methodName}: ${String(error)}`);
      }
    }

    // Preserve the original method syntax wholesale (including decorators, get, async, etc.)
    extensionProperties.push({
      name: methodName,
      originalKey: methodName,
      value: methodText,
      typeInfo,
      isObjectMethod: isClassMethodSyntax(method),
    });
  }

  if (options?.debug) {
    debugLog(
      options,
      `Extracted ${schemaFields.length} schema fields, ${extensionProperties.length} extension properties`
    );
  }

  return { schemaFields, extensionProperties };
}

/**
 * Extract intermediate model names from heritage clause and convert to trait names
 */
function extractIntermediateModelTraits(
  heritageClause: SgNode,
  root: SgNode,
  intermediateModelPaths: string[],
  options?: TransformOptions
): string[] {
  const intermediateTraits: string[] = [];
  const extendsText = heritageClause.text();

  // Get local names for all intermediate models
  const intermediateLocalNames = getIntermediateModelLocalNames(root, intermediateModelPaths, options);

  for (const localName of intermediateLocalNames) {
    if (extendsText.includes(localName)) {
      // Convert the import path to a trait name
      const modelPath = intermediateModelPaths.find((path) => {
        const pathLocalName = findEmberImportLocalName(root, [path], options, undefined, process.cwd());
        return pathLocalName === localName;
      });

      if (modelPath) {
        // Convert path like "my-app/core/data-field-model" to "data-field-model"
        let traitName = modelPath.split('/').pop() || modelPath;
        // Strip any file extension (.js, .ts)
        traitName = removeFileExtension(traitName);
        const dasherizedName = pascalToKebab(traitName).replace(TRAILING_MODEL_SUFFIX_REGEX, ''); // Remove trailing -model or model

        intermediateTraits.push(dasherizedName);
        debugLog(options, `DEBUG: Found intermediate model trait: ${dasherizedName} from ${modelPath}`);
      }
      break; // Only process the first match since a class can only extend one parent
    }
  }

  return intermediateTraits;
}

/**
 * Check if an import path represents a local mixin (not an external dependency)
 */
function isLocalMixin(importPath: string, options?: TransformOptions): boolean {
  // Node modules don't have slashes at the beginning or are package names
  if (!importPath.includes('/')) {
    return false; // Simple package name like 'lodash'
  }

  // Paths starting with relative indicators are local
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return true;
  }

  // Check if this matches the configured model or mixin import sources
  if (options?.modelImportSource && importPath.startsWith(options.modelImportSource)) {
    return true;
  }
  if (options?.mixinImportSource && importPath.startsWith(options.mixinImportSource)) {
    return true;
  }

  // Absolute paths that include common local directories are likely local
  if (importPath.includes('/mixins/') || importPath.startsWith('app/') || importPath.startsWith('addon/')) {
    return true;
  }

  // Package names with organization scopes like '@ember/object'
  if (importPath.startsWith('@') && !importPath.includes('/mixins/')) {
    return false;
  }

  // Default to treating it as local if we're not sure
  return true;
}

/**
 * Extract mixin names from heritage clause and convert to trait names
 */
function extractMixinTraits(
  heritageClause: SgNode,
  root: SgNode,
  mixinImports: Map<string, string>,
  options?: TransformOptions
): string[] {
  const mixinTraits: string[] = [];

  // Find the .extend() call using AST
  const extendCall = heritageClause.find({
    rule: {
      kind: NODE_KIND_CALL_EXPRESSION,
      has: {
        kind: NODE_KIND_MEMBER_EXPRESSION,
        has: {
          kind: NODE_KIND_PROPERTY_IDENTIFIER,
          regex: 'extend',
        },
      },
    },
  });

  if (extendCall) {
    // Get the arguments of the .extend() call
    const argumentsNode = extendCall.find({ rule: { kind: NODE_KIND_ARGUMENTS } });
    if (argumentsNode) {
      // Find all identifier nodes within the arguments (these are the mixin names)
      const mixinIdentifiers = argumentsNode.findAll({ rule: { kind: NODE_KIND_IDENTIFIER } });

      for (const identifierNode of mixinIdentifiers) {
        const mixinName = identifierNode.text();
        debugLog(options, `Found mixin identifier: ${mixinName}`);

        // Check if this is an intermediate model import - if so, skip it as it's handled elsewhere
        if (options?.intermediateModelPaths) {
          const isIntermediateModel = options.intermediateModelPaths.some((path) => {
            const localName = findEmberImportLocalName(root, [path], options, undefined, process.cwd());
            return localName === mixinName;
          });
          if (isIntermediateModel) {
            debugLog(options, `DEBUG: Skipping ${mixinName} as it's an intermediate model, not a mixin`);
            continue;
          }
        }

        // Try to get the import path for this mixin
        const importPath = mixinImports.get(mixinName);

        // Skip external node module dependencies (but not local app mixins)
        if (importPath && !isLocalMixin(importPath, options)) {
          debugLog(
            options,
            `DEBUG: Skipping ${mixinName} as it's an external dependency (${importPath}), not a local mixin`
          );
          continue;
        }
        if (importPath) {
          // Use the import path to generate the trait name (same as mixin-to-schema conversion)
          const traitName = mixinNameToTraitName(importPath, true); // true for string reference (dasherized)
          mixinTraits.push(traitName);
        } else if (mixinImports.size > 0 || importPath !== undefined) {
          // Fallback to using the identifier name if no import found
          // But only if we have a mixin import for this name
          mixinTraits.push(mixinNameToTraitName(mixinName, true));
        }
      }
    }
  }

  return mixinTraits;
}

/**
 * Extract mixin extensions for a model file
 * Uses the pre-computed modelToMixinsMap to look up which mixins this model uses,
 * then checks the mixinExtensionCache to get extension names for mixins with extension properties
 */
function extractMixinExtensions(
  _heritageClause: SgNode,
  _root: SgNode,
  _mixinImports: Map<string, string>,
  filePath: string,
  options?: TransformOptions
): string[] {
  const mixinExtensions: string[] = [];

  const modelMixins = options?.modelToMixinsMap?.get(filePath);
  if (!modelMixins || modelMixins.size === 0) {
    return mixinExtensions;
  }

  for (const mixinFilePath of modelMixins) {
    // Check the mixinExtensionCache to see if this mixin has an extension
    const cacheEntry = mixinExtensionCache.get(mixinFilePath);
    if (cacheEntry?.hasExtension && cacheEntry.extensionName) {
      mixinExtensions.push(cacheEntry.extensionName);
    }
  }

  return mixinExtensions;
}

/**
 * Pre-analyze all mixins in modelConnectedMixins to populate the extension cache
 * Uses pre-parsed ParsedFile data to avoid redundant AST parsing.
 */
export function preAnalyzeConnectedMixinExtensions(
  parsedMixins: Map<Filename, ParsedFile>,
  options: TransformOptions
): void {
  if (!options.modelConnectedMixins || options.modelConnectedMixins.size === 0) {
    debugLog(options, 'No modelConnectedMixins to pre-analyze');
    return;
  }

  for (const mixinFilePath of options.modelConnectedMixins) {
    const parsedMixin = parsedMixins.get(mixinFilePath);
    if (mixinExtensionCache.has(mixinFilePath) || !parsedMixin) {
      continue;
    }

    try {
      // Use pre-parsed data instead of re-parsing the file
      const hasExtension = parsedMixin.hasExtension;
      const extensionName = hasExtension ? `${parsedMixin.camelName}Extension` : null;

      mixinExtensionCache.set(mixinFilePath, { hasExtension, extensionName });
    } catch {
      mixinExtensionCache.set(mixinFilePath, { hasExtension: false, extensionName: null });
    }
  }
}

/**
 * Generate LegacyResourceSchema object
 */
function generateLegacyResourceSchema(
  modelName: string,
  type: string,
  schemaFields: SchemaField[],
  mixinTraits: string[],
  mixinExtensions: string[],
  extensionProperties: Array<{ name: string; originalKey: string; value: string }>,
  source?: string
): string {
  const schemaName = `${modelName}Schema`;
  const extensionName = `${modelName}Extension`;

  const objectExtensions = [...mixinExtensions];
  if (extensionProperties.length > 0) {
    objectExtensions.push(extensionName);
  }

  const legacySchema = buildLegacySchemaObject(type, schemaFields, mixinTraits, objectExtensions);

  return generateExportStatement(schemaName, legacySchema);
}

/**
 * Transform relative model imports in source to schema type imports
 */
function transformModelImportsInSource(source: string, root: SgNode): string {
  let result = source;

  // Find all import declarations
  const imports = root.findAll({ rule: { kind: 'import_statement' } });

  for (const importNode of imports) {
    const importText = importNode.text();

    // Check if this is a relative import to another model file
    // Pattern 1: import type SomeThing from './some-thing';
    const relativeImportMatch = importText.match(RELATIVE_TYPE_IMPORT_REGEX);
    // Pattern 2: import type { SomeThing } from './some-thing.schema';
    const namedImportMatch = importText.match(NAMED_TYPE_IMPORT_REGEX);

    if (relativeImportMatch) {
      const [fullMatch, typeName, relativePath] = relativeImportMatch;

      // Transform to named import from schema
      // e.g., import type SomeThing from './some-thing.ts';
      // becomes import type { SomeThing } from './some-thing.schema';
      // But remove 'Model' suffix if present since interfaces don't use it
      const pathWithoutExtension = removeFileExtension(relativePath);
      const interfaceName = typeName.endsWith('Model') ? typeName.slice(0, -5) : typeName;

      const transformedImport =
        typeName !== interfaceName
          ? `import type { ${interfaceName} as ${typeName} } from '${pathWithoutExtension}.schema';`
          : `import type { ${typeName} } from '${pathWithoutExtension}.schema';`;

      result = result.replace(fullMatch, transformedImport);
    } else if (namedImportMatch) {
      const [fullMatch, typeName, relativePath] = namedImportMatch;

      // Handle named imports from schema files - fix Model suffix issue
      if (relativePath.includes('.schema') && typeName.endsWith('Model')) {
        const pathWithoutExtension = relativePath.replace(SCHEMA_SUFFIX_REGEX, '');
        const interfaceName = typeName.slice(0, -5); // Remove 'Model' suffix
        const transformedImport = `import type { ${interfaceName} as ${typeName} } from '${pathWithoutExtension}.schema';`;

        result = result.replace(fullMatch, transformedImport);
      }
    }
  }

  return result;
}
