/**
 * AST Utilities Module
 *
 * This module re-exports utilities from focused sub-modules for backward compatibility.
 * The implementation has been split into the following modules:
 *
 * - path-utils.ts: Path manipulation, case conversion, file utilities, and import resolution
 * - type-utils.ts: TypeScript type extraction and generation
 * - ast-helpers.ts: AST parsing, traversal, and object literal parsing
 * - schema-generation.ts: Schema field and artifact generation
 * - import-utils.ts: Import resolution and transformation
 * - extension-generation.ts: Extension artifact creation
 */

// Re-export from path-utils
export {
  extractBaseName,
  extractCamelCaseName,
  extractPascalCaseName,
  toPascalCase,
  mixinNameToTraitName,
  removeQuotes,
  getLanguageFromPath,
  getFileExtension,
  indentCode,
  replaceWildcardPattern,
  resolveRelativeImport,
  resolveImportPath,
  isImportFromSource,
  getImportSourceConfig,
} from './path-utils.ts';
export type { ImportSourceConfig } from './path-utils.ts';

export {
  DEFAULT_EMBER_DATA_SOURCE,
  DEFAULT_MIXIN_SOURCE,
  BUILT_IN_TYPE_MAPPINGS,
  getTypeScriptTypeForAttribute,
  schemaFieldToTypeScriptType,
  extractTypeFromDeclaration,
  extractTypeFromDecorator,
  extractTypeFromMethod,
  extractTypesFromInterface,
} from './type-utils.ts';
export type { ExtractedType, SchemaFieldForType } from './type-utils.ts';

// Re-export from ast-helpers
export {
  findDefaultExport,
  findClassDeclaration,
  getExportedIdentifier,
  parseDecoratorArgumentsWithNodes,
  parseObjectLiteralFromNode,
  parseObjectPropertiesFromNode,
  parseObjectLiteral,
  withTransformWrapper,
  findAssociatedInterface,
  getEmberDataImports,
  getMixinImports,
} from './ast-helpers.ts';

// Re-export from schema-generation
export {
  getFieldKindFromDecorator,
  generateExportStatement,
  schemaFieldToLegacyFormat,
  buildLegacySchemaObject,
  convertToSchemaField,
  generateInterfaceCode,
  createTypeArtifact,
  createExtensionArtifactWithTypes,
  generateMergedSchemaCode,
  buildTraitArtifacts,
  collectRelationshipImports,
  collectTraitImports,
  mapFieldsToTypeProperties,
  buildTraitSchemaObject,
  SCHEMA_OPTION_REF_PREFIX,
} from './schema-generation.ts';
export type { TransformArtifact, PropertyInfo, SchemaField, MergedSchemaOptions } from './schema-generation.ts';

// Re-export from import-utils
export {
  transformWarpDriveImport,
  generateWarpDriveTypeImport,
  generateTraitImport,
  getModelImportSource,
  getResourcesImport,
  transformModelToResourceImport,
  isModelImportPath,
  isMixinImportPath,
  isSpecialMixinImport,
  isMixinFile,
  isModelFile,
  findEmberImportLocalName,
  processImports,
  getModelImportSources,
  WARP_DRIVE_MODEL,
  FRAGMENT_DECORATOR_SOURCE,
  FRAGMENT_BASE_SOURCE,
} from './import-utils.ts';

// Re-export from extension-generation
export { generateExtensionCode, createExtensionFromOriginalFile } from './extension-generation.ts';
