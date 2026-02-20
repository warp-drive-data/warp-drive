/**
 * AST Utilities Module
 *
 * This module re-exports utilities from focused sub-modules for backward compatibility.
 * The implementation has been split into the following modules:
 *
 * - logging.ts: Debug and error logging utilities
 * - path-utils.ts: Path manipulation, case conversion, file utilities, and import resolution
 * - type-utils.ts: TypeScript type extraction and generation
 * - ast-helpers.ts: AST parsing, traversal, and object literal parsing
 * - schema-generation.ts: Schema field and artifact generation
 * - import-utils.ts: Import resolution and transformation
 * - extension-generation.ts: Extension artifact creation
 */

// Re-export from logging
export { debugLog, errorLog } from './logging.js';

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
} from './path-utils.js';
export type { ImportSourceConfig } from './path-utils.js';

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
} from './type-utils.js';
export type { ExtractedType, SchemaFieldForType } from './type-utils.js';

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
} from './ast-helpers.js';

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
  collectRelationshipImports,
  collectTraitImports,
  mapFieldsToTypeProperties,
  buildTraitSchemaObject,
} from './schema-generation.js';
export type { TransformArtifact, PropertyInfo, SchemaField, MergedSchemaOptions } from './schema-generation.js';

// Re-export from import-utils
export {
  transformWarpDriveImport,
  generateWarpDriveTypeImport,
  generateCommonWarpDriveImports,
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
} from './import-utils.js';

// Re-export from extension-generation
export {
  generateExtensionCode,
  createExtensionFromOriginalFile,
  appendExtensionSignatureType,
} from './extension-generation.js';
