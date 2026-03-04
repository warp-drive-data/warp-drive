import { parse, type SgNode } from '@ast-grep/napi';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

import { logger } from '../../../utils/logger.js';
import type { TransformerResult } from '../codemod.js';
import { getConfiguredImport, type TransformOptions } from '../config.js';
import type { SchemaArtifact } from '../utils/artifact.js';
import { createResourceArtifactConfig, createTraitArtifactConfig } from '../utils/artifact.js';
import type { ExtractedType, SchemaField, TransformArtifact } from '../utils/ast-utils.js';
import {
  buildLegacySchemaObject,
  buildTraitSchemaObject,
  collectRelationshipImports,
  collectTraitImports,
  findClassDeclaration,
  findDefaultExport,
  findEmberImportLocalName,
  FRAGMENT_BASE_SOURCE,
  generateMergedSchemaCode,
  getEmberDataImports,
  getExportedIdentifier,
  getFileExtension,
  getLanguageFromPath,
  getMixinImports,
  getModelImportSources,
  isModelFile,
  mapFieldsToTypeProperties,
  mixinNameToTraitName,
  SCHEMA_OPTION_REF_PREFIX,
  toPascalCase,
} from '../utils/ast-utils.js';
import {
  FILE_EXTENSION_JS,
  FILE_EXTENSION_TS,
  NODE_KIND_ARGUMENTS,
  NODE_KIND_CALL_EXPRESSION,
  NODE_KIND_CLASS_DECLARATION,
  NODE_KIND_CLASS_HERITAGE,
  NODE_KIND_IDENTIFIER,
  NODE_KIND_IMPORT_CLAUSE,
  NODE_KIND_IMPORT_STATEMENT,
  NODE_KIND_MEMBER_EXPRESSION,
  NODE_KIND_PROPERTY_IDENTIFIER,
} from '../utils/code-processing.js';
import { createExtensionFromOriginalFile } from '../utils/extension-generation.js';
import type { ParsedFile } from '../utils/file-parser.js';
import { parseFile } from '../utils/file-parser.js';
import { removeQuotes, replaceWildcardPattern } from '../utils/path-utils.js';
import type { FieldTypeInfo } from '../utils/schema-generation.js';
import {
  MODEL_NAME_SUFFIX_REGEX,
  normalizePath,
  pascalToKebab,
  removeFileExtension,
  toKebabCase,
  TRAILING_MODEL_SUFFIX_REGEX,
} from '../utils/string.js';

/**
 * Find and return the source text of export declarations (e.g. `export const BIRTHAGE = 0;`)
 * for each identifier in `identifierRefs`. These are included verbatim in the schema file
 * so that schema field options can reference them by name.
 */
function collectConstantDecls(filePath: string, source: string, identifierRefs: Set<string>): string {
  const lang = getLanguageFromPath(filePath);
  const ast = parse(lang, source);
  const root = ast.root();
  const declarations: string[] = [];

  for (const exportStmt of root.findAll({ rule: { kind: 'export_statement' } })) {
    const decl = exportStmt.find({
      rule: { any: [{ kind: 'lexical_declaration' }, { kind: 'variable_declaration' }] },
    });
    if (!decl) continue;

    for (const declarator of decl.findAll({ rule: { kind: 'variable_declarator' } })) {
      const nameNode = declarator.field('name');
      if (nameNode && identifierRefs.has(nameNode.text())) {
        declarations.push(exportStmt.text());
        break;
      }
    }
  }

  return declarations.join('\n');
}

/** Method names that should be skipped (typically callback methods) */
const SKIP_METHOD_NAMES = ['after'];

const log = logger.for('model-processor');

/**
 * Shared result type for model analysis
 */
export interface ModelAnalysisResult {
  isValid: boolean;
  modelImportLocal?: string;
  isFragment?: boolean;
  defaultExportNode?: SgNode;
  schemaFields: SchemaField[];
  comment?: string;
  extensionProperties: Array<{
    name: string;
    originalKey: string;
    value: string;
    typeInfo: ExtractedType | null;
    isObjectMethod?: boolean;
  }>;
  mixinTraits: string[];
  mixinExtensions: string[];
  heritageLocalNames: string[];
  modelName: string;
  baseName: string;
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
    heritageLocalNames: [],
    modelName,
    baseName,
    comment: undefined,
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

  const expectedSources = getModelImportSources(options);
  const modelImportLocal = findEmberImportLocalName(root, expectedSources, options, filePath, process.cwd());
  log.debug(`DEBUG: Model import local: ${modelImportLocal}`);

  const fragmentImportLocal = findEmberImportLocalName(root, [FRAGMENT_BASE_SOURCE], options, filePath, process.cwd());
  log.debug(`DEBUG: Fragment import local: ${fragmentImportLocal}`);

  const defaultExportNode = findDefaultExport(root, options);
  log.debug(`DEBUG: Default export node: ${defaultExportNode ? 'found' : 'not found'}`);
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
        log.debug(`DEBUG: Valid model via intermediate fragment path: ${localName}`);
        break;
      }
    }
  }

  log.debug(`DEBUG: Is valid model: ${isValidModel}`);
  if (!isValidModel) {
    log.debug('DEBUG: Not a valid model class, skipping');
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
  log.debug(`DEBUG: Is Fragment class: ${isFragment}`);

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

    const mixinExts = extractMixinExtensions(filePath, options);
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
    log.debug(`Resolved intermediate model path ${modelPath} to: ${relativePath}`);
    const possiblePaths = [`${relativePath}.ts`, `${relativePath}.js`];

    let filePath: string | null = null;
    let source: string | null = null;

    log.debug(`Checking intermediate model paths for ${modelPath}: ${possiblePaths.join(', ')}`);
    for (const possiblePath of possiblePaths) {
      try {
        if (existsSync(possiblePath)) {
          filePath = possiblePath;
          source = readFileSync(possiblePath, 'utf-8');
          log.debug(`Found intermediate model file: ${possiblePath}`);
          break;
        }
      } catch (error) {
        log.debug(`Could not read ${possiblePath}: ${String(error)}`);
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
      log.debug(`Processing intermediate model: ${modelPath}`);

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
            log.debug(`Wrote ${artifact.type}: ${artifactPath}`);
          }
        }
      }

      artifacts.push(...traitArtifacts);
      log.debug(`Generated ${traitArtifacts.length} artifacts for ${modelPath}`);
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
  entity: SchemaArtifact,
  analysis: ModelAnalysisResult,
  options: TransformOptions
): TransformArtifact[] {
  const filePath = entity.path;
  const source = entity.parsedFile.source;
  const { comment, schemaFields, mixinTraits, mixinExtensions, heritageLocalNames, modelName, baseName, isFragment } =
    analysis;
  const artifacts: TransformArtifact[] = [];

  // Determine the file extension based on the original model file
  const originalExtension = getFileExtension(filePath);
  const isTypeScript = originalExtension === '.ts';
  const resourceConfig = createResourceArtifactConfig(options, analysis, isTypeScript);

  // Collect imports needed for schema interface
  const schemaImports = new Set<string>();
  const typeDeclarations = new Set<string>();

  // Collect schema field types - start with [Type] symbol
  const schemaFieldTypes: FieldTypeInfo[] = [
    {
      name: '[Type]',
      transformInferredType: 'null',
      typeInfo: {
        readonly: true,
        type: `'${toKebabCase(baseName)}'`,
      },
    },
    {
      name: 'id',
      transformInferredType: 'string | null',
      typeInfo: {
        readonly: false,
        type: 'string | null',
      },
    },
    ...mapFieldsToTypeProperties(schemaFields, options),
  ];

  const typeImport = getConfiguredImport(options, 'Type');
  schemaImports.add(`import type { Type } from '${typeImport.source}'`);
  const WithLegacyImport = getConfiguredImport(options, 'WithLegacy');
  schemaImports.add(`import type { WithLegacy } from '${WithLegacyImport.source}'`);
  collectRelationshipImports(filePath, schemaFields, baseName, schemaImports, typeDeclarations, options);
  // collectTraitImports(mixinTraits, schemaImports, options);

  // Build the schema object
  const schemaName = entity.schemaName;
  const schemaObject = buildLegacySchemaObject(baseName, schemaFields, mixinTraits, mixinExtensions, isFragment);

  // Collect identifier refs from schema field options (e.g. `defaultValue: BIRTHAGE`)
  // and find their export declarations in the source to include in the schema file.
  const identifierRefs = new Set<string>();
  for (const field of schemaFields) {
    if (field.options) {
      for (const value of Object.values(field.options)) {
        if (typeof value === 'string' && value.startsWith(SCHEMA_OPTION_REF_PREFIX)) {
          identifierRefs.add(value.slice(SCHEMA_OPTION_REF_PREFIX.length));
        }
      }
    }
  }
  const constantDeclarations =
    identifierRefs.size > 0 ? collectConstantDecls(filePath, source, identifierRefs) : undefined;

  // Generate merged schema code (schema + types in one file)
  const mergedSchemaCode = generateMergedSchemaCode({
    config: resourceConfig,
    schemaObject,
    properties: schemaFieldTypes,
    traits: mixinTraits,
    imports: schemaImports,
    options,
    comment,
    constantDeclarations,
  });

  const hasType = mergedSchemaCode.interfaceDeclaration && mergedSchemaCode.interfaceDeclaration.trim() !== '';
  const typeString = typeDeclarations.size > 0 ? Array.from(typeDeclarations).join('\n') + '\n' : false;
  const includeTypesInSchema = options.combineSchemasAndTypes || !hasType;

  artifacts.push({
    type: 'schema',
    name: schemaName,
    code: [
      mergedSchemaCode.schemaImports,
      includeTypesInSchema ? mergedSchemaCode.typeImports : null,
      includeTypesInSchema ? typeString : null,
      mergedSchemaCode.schemaDeclaration,
      includeTypesInSchema ? mergedSchemaCode.interfaceDeclaration : null,
    ]
      .filter(Boolean)
      .join('\n'),
    baseName,
    suggestedFileName: `${baseName}.schema${resourceConfig.schemaIsTyped ? '.ts' : '.js'}`,
  });

  if (!options.combineSchemasAndTypes && hasType) {
    artifacts.push({
      type: 'type',
      name: modelName,
      code: [mergedSchemaCode.typeImports, typeString, mergedSchemaCode.interfaceDeclaration]
        .filter(Boolean)
        .join('\n'),
      baseName,
      suggestedFileName: `${baseName}.type.ts`,
    });
  }

  const extensionArtifact = resourceConfig.hasExtension
    ? createExtensionFromOriginalFile(
        resourceConfig,
        filePath,
        source,
        analysis.extensionProperties,
        options,
        undefined,
        'resource',
        undefined,
        heritageLocalNames
      )
    : null;

  log.debug(`Extension artifact created: ${!!extensionArtifact}`);
  if (extensionArtifact) {
    artifacts.push(extensionArtifact);
  }

  return artifacts;
}

export function toArtifacts(entity: SchemaArtifact, options: TransformOptions): TransformerResult {
  log.debug(`=== DEBUG: Processing ${entity.path} ===`);

  const analysis = analyzeModelFromParsed(entity.parsedFile, options);
  if (!analysis.isValid) {
    log.debug('Model analysis failed, skipping artifact generation');
    return { artifacts: [], skipReason: 'invalid-model' };
  }
  return { artifacts: generateRegularModelArtifacts(entity, analysis, options) };
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
    const schemaFields: SchemaField[] = parsedFile.fields;

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
      heritageLocalNames: parsedFile.heritageLocalNames,
      modelName,
      baseName,
      comment: parsedFile.comment,
    };
  } catch (error) {
    log.debug(`Error analyzing parsed model: ${String(error)}`);
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
export function generateIntermediateModelTraitArtifacts(
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
  const parsedFile = parseFile(filePath, source, options);
  const analysis = analyzeModelFromParsed(parsedFile, options);

  if (!analysis.isValid) {
    log.debug(`Intermediate model ${modelPath} analysis failed, skipping trait generation`);
    return [];
  }

  const { schemaFields, mixinTraits, extensionProperties } = analysis;

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
      transformInferredType: 'unknown',
      typeInfo: {
        type: 'string | null',
        readonly: false,
      },
    });
    log.debug(`DEBUG: Added id property to ${traitName} trait`);
  }

  // Add `store` property if storeType is configured
  const hasStore = traitFieldTypes.some((f) => f.name === 'store');

  if (!hasStore && options?.storeType) {
    const storeTypeName = options.storeType.name || 'Store';
    traitFieldTypes.push({
      name: 'store',
      transformInferredType: 'unknown',
      typeInfo: {
        type: storeTypeName,
        readonly: true,
      },
    });
    log.debug(`DEBUG: Added store property with type ${storeTypeName} to ${traitName} trait`);
  }

  // Collect imports for trait interface
  const traitImports = new Set<string>();
  const declarations = new Set<string>();

  traitImports.add(`type { BelongsToReference, HasManyReference, Errors } from '@warp-drive/legacy/model/-private'`);
  collectRelationshipImports(filePath, schemaFields, traitName, traitImports, declarations, options);
  collectTraitImports(mixinTraits, traitImports, options, true);

  if (options?.storeType) {
    const storeTypeName = options.storeType.name || 'Store';
    const storeImport = `type { ${storeTypeName} } from '${options.storeType.import}'`;
    traitImports.add(storeImport);
    log.debug(`DEBUG: Added Store type import: ${storeImport}`);
  }

  // Build the trait schema object
  const traitSchemaObject = buildTraitSchemaObject(schemaFields, mixinTraits, { legacyFieldOrder: true });

  const traitConfig = createTraitArtifactConfig(
    options,
    traitName,
    traitPascalName,
    mixinTraits,
    extensionProperties.length > 0,
    isTypeScript
  );

  const mergedSchemaCode = generateMergedSchemaCode({
    config: traitConfig,
    schemaObject: traitSchemaObject,
    properties: traitFieldTypes,
    traits: mixinTraits,
    imports: traitImports,
    options,
  });

  const traitCode = [
    mergedSchemaCode.schemaImports,
    mergedSchemaCode.typeImports,
    mergedSchemaCode.schemaDeclaration,
    mergedSchemaCode.interfaceDeclaration,
  ]
    .filter(Boolean)
    .join('\n');

  artifacts.push({
    type: 'trait',
    name: traitConfig.identifiers.schema,
    code: traitCode,
    baseName: traitName,
    suggestedFileName: `${traitName}.schema${options.disableTypescriptSchemas ? '.js' : '.ts'}`,
  });

  if (extensionProperties.length > 0) {
    const traitImportPath = options?.traitsImport
      ? `${options.traitsImport}/${traitName}.schema`
      : `../traits/${traitName}.schema`;
    const extensionArtifact = createExtensionFromOriginalFile(
      traitConfig,
      filePath,
      source,
      extensionProperties,
      options,
      traitImportPath,
      'model'
    );
    if (extensionArtifact) {
      artifacts.push(extensionArtifact);
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

        const sourceText = removeQuotes(source.text());

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
      log.debug(`DEBUG: Found intermediate model local name: ${localName} for path: ${modelPath}`);
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

        const sourceText = removeQuotes(source.text());

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
              log.debug(`DEBUG: Matched intermediate fragment (direct): ${sourceText} for config: ${fragmentPath}`);
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
                      log.debug(
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
            log.debug(`DEBUG: Error resolving intermediate fragment path: ${String(error)}`);
          }
        }
      }
    }

    if (localName) {
      localNames.push(localName);
      log.debug(`DEBUG: Found intermediate fragment local name: ${localName} for path: ${fragmentPath}`);
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
  log.debug(
    `DEBUG: Checking if export extends model '${modelLocalName}' or fragment/base model '${fragmentOrBaseModelLocalName}'`
  );

  const classDeclaration = findClassDeclaration(exportNode, root, options);

  if (!classDeclaration) {
    log.debug('DEBUG: No class declaration found in export or by name');
    return false;
  }

  log.debug(`DEBUG: Found class declaration: ${classDeclaration.text().slice(0, 100)}...`);
  log.debug(
    `DEBUG: Class children: ${classDeclaration
      .children()
      .map((c) => `${c.kind()}:${c.text().slice(0, 20)}`)
      .join(', ')}`
  );

  // Check if the class has a heritage clause (extends)
  const heritageClause = classDeclaration.find({ rule: { kind: NODE_KIND_CLASS_HERITAGE } });
  if (!heritageClause) {
    log.debug('DEBUG: No class_heritage found in class');
    return false;
  }

  // Check if it extends our model local name or calls .extend() on it
  const extendsText = heritageClause.text();
  log.debug(`DEBUG: Heritage clause: ${extendsText}`);

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
      log.debug(
        `DEBUG: Found chained extension through intermediate model: ${intermediateLocalNames.find((name) => extendsText.includes(name))}`
      );
    }
  }

  log.debug(
    `DEBUG: Direct extension: ${isDirectExtension}, Base model extension: ${isBaseModelExtension}, Chained extension: ${isChainedExtension}`
  );

  return isDirectExtension || isBaseModelExtension || isChainedExtension;
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
        log.debug(`DEBUG: Found intermediate model trait: ${dasherizedName} from ${modelPath}`);
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
        log.debug(`Found mixin identifier: ${mixinName}`);

        // Check if this is an intermediate model import - if so, skip it as it's handled elsewhere
        if (options?.intermediateModelPaths) {
          const isIntermediateModel = options.intermediateModelPaths.some((path) => {
            const localName = findEmberImportLocalName(root, [path], options, undefined, process.cwd());
            return localName === mixinName;
          });
          if (isIntermediateModel) {
            log.debug(`DEBUG: Skipping ${mixinName} as it's an intermediate model, not a mixin`);
            continue;
          }
        }

        // Try to get the import path for this mixin
        const importPath = mixinImports.get(mixinName);

        // Skip external node module dependencies (but not local app mixins)
        if (importPath && !isLocalMixin(importPath, options)) {
          log.debug(`DEBUG: Skipping ${mixinName} as it's an external dependency (${importPath}), not a local mixin`);
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
 * Get mixin extension names using the entity registry.
 */
function extractMixinExtensions(filePath: string, options?: TransformOptions): string[] {
  const registry = options?.entityRegistry;
  if (!registry) return [];

  const entity = registry.get(filePath);
  if (!entity) return [];

  return entity.traitExtensionNames;
}
