import type { SgNode } from '@ast-grep/napi';
import { existsSync } from 'fs';
import { join } from 'path';

import { logger } from '../../../utils/logger.js';
import { getConfiguredImport, type TransformOptions } from '../config.js';
import type { ArtifactConfig, SchemaArtifactRegistry } from './artifact.js';
import { deriveResourceExtensionName, deriveTraitExtensionName } from './artifact.js';
import { type ExtensionContext, generateRegistrationBlock } from './extension-generation.js';
import { generateTraitImport, isModelImportPath, transformModelToResourceImport } from './import-utils.js';
import { normalizeClassicImport, removeQuotes, toPascalCase } from './path-utils.js';
import type { ExtractedType } from './type-utils.js';
import { schemaFieldToTypeScriptType } from './type-utils.js';

const log = logger.for('schema-generation');

/**
 * Shared artifact interface for both transforms
 */
export interface TransformArtifact {
  /** Type determines output directory routing */
  type: string;
  /** Suggested export name */
  name: string;
  /** Code to write to the artifact file */
  code: string;
  /** The underlying entity name used to suggest file name and export name */
  baseName: string;
  /** Suggested filename (without directory) */
  suggestedFileName: string;
}

/**
 * Interface for property information including TypeScript types
 */
export interface PropertyInfo {
  name: string;
  originalKey: string;
  value: string;
  /** Extracted TypeScript type information */
  typeInfo: ExtractedType | null;
  /** Whether this property is defined using object method syntax */
  isObjectMethod?: boolean;
}

/**
 * Interface for schema field information
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export interface SchemaField {
  name: string;
  kind: 'attribute' | 'belongsTo' | 'hasMany' | 'schema-object' | 'schema-array' | 'array';
  type?: string;
  options?: Record<string, unknown>;
  comment?: string;
  typeInfo: ExtractedType | null;
}

/**
 * Map EmberData decorator names to WarpDrive field kinds
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export function getFieldKindFromDecorator(decoratorName: string): string {
  switch (decoratorName) {
    case 'hasMany':
      return 'hasMany';
    case 'belongsTo':
      return 'belongsTo';
    case 'attr':
      return 'attribute';
    case 'fragment':
      return 'schema-object';
    case 'fragmentArray':
      return 'schema-array';
    case 'array':
      return 'array';
    default:
      return 'field'; // fallback
  }
}

/**
 * Generate an export statement with a JSON object
 * Shared pattern used by both model-to-schema and mixin-to-schema transforms
 */
export function generateExportStatement(exportName: string, jsonObject: Record<string, unknown>): string {
  // JSON.stringify handles quoting correctly - strings are quoted, booleans/numbers are not
  const jsonString = JSON.stringify(jsonObject, null, 2);

  return `export const ${exportName} = ${jsonString};`;
}

/**
 * Convert a SchemaField to the legacy schema field format
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export function schemaFieldToLegacyFormat(field: SchemaField): Record<string, unknown> {
  const schemaField: Record<string, unknown> = {
    kind: field.kind,
    name: field.name,
  };

  if (field.type) {
    schemaField.type = field.type;
  }

  if (field.options && Object.keys(field.options).length > 0) {
    schemaField.options = field.options;
  }

  return schemaField;
}

/**
 * Build the core legacy schema object structure
 * Shared between model-to-schema and mixin-to-schema transforms
 */
export function buildLegacySchemaObject(
  type: string,
  schemaFields: SchemaField[],
  mixinTraits: string[],
  mixinExtensions: string[],
  options: { isFragment?: boolean; useWithDefaults?: boolean }
): Record<string, unknown> {
  const { isFragment, useWithDefaults } = options;
  const legacySchema: Record<string, unknown> = isFragment
    ? {
        type: `fragment:${type}`,
        legacy: true,
        identity: null,
        fields: schemaFields.map(schemaFieldToLegacyFormat),
      }
    : useWithDefaults
      ? {
          type,
          fields: schemaFields.map(schemaFieldToLegacyFormat),
        }
      : {
          type,
          legacy: true,
          identity: { kind: '@id', name: 'id' },
          fields: schemaFields.map(schemaFieldToLegacyFormat),
        };

  if (mixinTraits.length > 0) {
    legacySchema.traits = [...mixinTraits];
  }

  if (mixinExtensions.length > 0 || isFragment) {
    const fragmentExtensions = isFragment ? ['ember-object', 'fragment'] : [];
    legacySchema.objectExtensions = [...fragmentExtensions, ...mixinExtensions];
  }

  return legacySchema;
}

/**
 * Sentinel prefix used to mark identifier references in schema field options.
 * Values like `{ defaultValue: BIRTHAGE }` are stored as `'__ref__:BIRTHAGE'`
 * so the code generator can emit them unquoted.
 */
export const SCHEMA_OPTION_REF_PREFIX = '__ref__:';

/**
 * Parse options object from an AST node for schema field conversion.
 * Identifier values (e.g. `BIRTHAGE`) are preserved as code references
 * using the `__ref__:` sentinel prefix so they can be emitted unquoted.
 */
function parseSchemaFieldValue(valueNode: SgNode): unknown {
  const kind = valueNode.kind();
  if (kind === 'string') {
    return valueNode.text().slice(1, -1);
  } else if (kind === 'true') {
    return true;
  } else if (kind === 'false') {
    return false;
  } else if (kind === 'number') {
    return parseFloat(valueNode.text());
  } else if (kind === 'null') {
    return null;
  } else if (kind === 'identifier') {
    return SCHEMA_OPTION_REF_PREFIX + valueNode.text();
  } else if (kind === 'object') {
    return parseSchemaFieldOptions(valueNode);
  } else if (kind === 'array') {
    return valueNode
      .children()
      .filter((child) => child.isNamed() && child.kind() !== ',')
      .map((child) => parseSchemaFieldValue(child));
  }
  return valueNode.text();
}

function parseSchemaFieldOptions(optionsNode: SgNode | undefined): Record<string, unknown> {
  if (!optionsNode || optionsNode.kind() !== 'object') {
    return {};
  }

  const result: Record<string, unknown> = {};
  const properties = optionsNode.children().filter((child) => child.kind() === 'pair');

  for (const property of properties) {
    const keyNode = property.field('key');
    const valueNode = property.field('value');
    if (!keyNode || !valueNode) continue;

    let key = keyNode.text();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }

    const value = parseSchemaFieldValue(valueNode);

    result[key] = value;
  }

  return result;
}

/**
 * Core implementation for converting EmberData decorator calls to schema fields
 * This is the shared logic used by the schema field conversion function
 */
function convertToSchemaFieldCore(
  name: string,
  decoratorType: string,
  firstArg: string | undefined,
  options: Record<string, unknown>
): SchemaField | null {
  switch (decoratorType) {
    case 'attr': {
      const type = firstArg ? removeQuotes(firstArg) : undefined;
      return {
        name,
        kind: getFieldKindFromDecorator('attr') as 'attribute',
        type,
        options: Object.keys(options).length > 0 ? options : undefined,
        typeInfo: null,
      };
    }
    case 'belongsTo': {
      const type = firstArg ? removeQuotes(firstArg) : undefined;
      return {
        name,
        kind: getFieldKindFromDecorator('belongsTo') as 'belongsTo',
        type,
        options: Object.keys(options).length > 0 ? options : undefined,
        typeInfo: null,
      };
    }
    case 'hasMany': {
      const type = firstArg ? removeQuotes(firstArg) : undefined;
      return {
        name,
        kind: getFieldKindFromDecorator('hasMany') as 'hasMany',
        type,
        options: Object.keys(options).length > 0 ? options : undefined,
        typeInfo: null,
      };
    }
    case 'fragment': {
      const fragmentType = firstArg ? removeQuotes(firstArg) : name;
      return {
        name,
        kind: getFieldKindFromDecorator('fragment') as 'schema-object',
        type: `fragment:${fragmentType}`,
        options: {
          objectExtensions: ['ember-object', 'fragment'],
          ...options,
        },
        typeInfo: null,
      };
    }
    case 'fragmentArray': {
      const fragmentType = firstArg ? removeQuotes(firstArg) : name;
      return {
        name,
        kind: getFieldKindFromDecorator('fragmentArray') as 'schema-array',
        type: `fragment:${fragmentType}`,
        options: {
          arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
          defaultValue: true,
          ...options,
        },
        typeInfo: null,
      };
    }
    case 'array': {
      // For array decorator, options are passed directly
      return {
        name,
        kind: getFieldKindFromDecorator('array') as 'array',
        type: `array:${name}`, // Will be singularized during schema generation
        options: {
          arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
          ...options,
        },
        typeInfo: null,
      };
    }
    default:
      return null;
  }
}

/**
 * Convert EmberData decorator call to schema field using AST nodes
 */
export function convertToSchemaField(
  name: string,
  decoratorType: string,
  args: { text: string[]; nodes: SgNode[] }
): SchemaField | null {
  // For 'array' decorator, the first arg is options (not type), so we need special handling
  const isArrayDecorator = decoratorType === 'array';
  const firstArg = isArrayDecorator ? undefined : args.text[0];
  const optionsArg = isArrayDecorator ? args.nodes[0] : args.nodes[1];
  const options = parseSchemaFieldOptions(optionsArg);

  return convertToSchemaFieldCore(name, decoratorType, firstArg, options);
}

/**
 * Generate TypeScript interface code
 */
export function generateInterfaceCode(
  options: TransformOptions,
  config: ArtifactConfig,
  comment: string | undefined,
  properties: Array<FieldTypeInfo>,
  imports?: string[]
): string {
  const lines: string[] = [];

  // Add imports
  if (imports && imports.length > 0) {
    imports.forEach((importStatement) => {
      // Check if the import statement already includes the 'import' keyword
      if (importStatement.startsWith('import ')) {
        lines.push(`${importStatement};`);
      } else {
        lines.push(`import ${importStatement};`);
      }
    });
    lines.push('');
  }

  lines.push(generateInterfaceOnly(options, config, comment, properties, '\t'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Create type artifact for interfaces
 */
export function createTypeArtifact(
  options: TransformOptions,
  config: ArtifactConfig,
  comment: string | undefined,
  properties: Array<FieldTypeInfo>,
  artifactContext?: 'resource' | 'extension' | 'trait',
  imports?: string[],
  fileExtension?: string
): TransformArtifact {
  const code = generateInterfaceCode(options, config, comment, properties, imports);
  const baseName = config.name;
  const interfaceName = config.identifiers.fieldsInterface ?? config.identifiers.schema;

  // Determine the type based on context to help with directory routing
  const typeString = artifactContext ? `${artifactContext}-type` : 'type';

  // Generate filename - types are now merged into .schema files
  const extension = fileExtension || '.ts';
  const fileName =
    artifactContext === 'extension'
      ? `${baseName}.ext${extension}` // Extensions use .ext suffix
      : `${baseName}.schema${extension}`; // Schemas and traits use .schema (types merged in)

  return {
    type: typeString,
    name: interfaceName,
    code,
    baseName,
    suggestedFileName: fileName,
  };
}

/**
 * Create extension and type artifacts for properties with TypeScript types
 * Note: Type artifacts are no longer generated separately - types are merged into schema files
 */
export function createExtensionArtifactWithTypes(
  baseName: string,
  entityName: string,
  extensionProperties: PropertyInfo[],
  extensionFormat: 'class' | 'object',
  fileExtension?: string,
  generateExtensionCode?: (
    name: string,
    props: Array<{ name: string; originalKey: string; value: string; isObjectMethod?: boolean }>,
    format: 'object' | 'class'
  ) => string,
  context: ExtensionContext = 'resource'
): { extensionArtifact: TransformArtifact | null; typeArtifact: TransformArtifact | null } {
  if (extensionProperties.length === 0) {
    return { extensionArtifact: null, typeArtifact: null };
  }

  const extensionName =
    context === 'trait' ? deriveTraitExtensionName(baseName) : deriveResourceExtensionName(baseName);

  // Use provided generator or create a simple fallback
  const generator =
    generateExtensionCode ||
    ((name, props, format) => {
      const registration = '\n\n' + generateRegistrationBlock(baseName, name);
      if (format === 'class') {
        const methods = props.map((p) => `  ${p.value}`).join('\n\n');
        return `export class ${name} {\n${methods}\n}` + registration;
      }
      const properties = props.map((p) => `  ${p.originalKey}: ${p.value}`).join(',\n');
      return `export const ${name} = {\n${properties}\n};` + registration;
    });

  // Create the extension artifact (JavaScript code)
  const extensionCode = generator(extensionName, extensionProperties, extensionFormat);

  // Use .ext suffix for extension files
  const ext = fileExtension || '.ts';
  const extFileName = `${baseName}.ext${ext}`;

  const extensionArtifact: TransformArtifact = {
    type: context === 'trait' ? 'trait-extension' : 'resource-extension',
    name: extensionName,
    code: extensionCode,
    baseName,
    suggestedFileName: extFileName,
  };

  // Type artifacts are no longer generated separately - types are merged into schema files
  return { extensionArtifact, typeArtifact: null };
}

/**
 * Collect relationship imports (belongsTo/hasMany) for schema fields.
 * Shared between model and mixin artifact generation.
 *
 */
export function collectRelationshipImports(
  currentFilePath: string,
  fields: SchemaField[],
  selfName: string,
  imports: Set<string>,
  declarations: Set<string>,
  options: TransformOptions,
  registry: SchemaArtifactRegistry,
  relationshipTypes: Set<string>
): void {
  const asyncHasManyImport = getConfiguredImport(options, 'AsyncHasMany');
  const hasManyImport = getConfiguredImport(options, 'HasMany');
  let hasAsyncHasMany = false;
  let hasHasMany = false;
  const newImports = new Map<string, Map<string, { local: string; isType: boolean }>>();
  const finalImports = new Set<string>();

  function addImport(imp: { imported: string; local?: string; source: string; isType?: boolean }): void {
    if (!newImports.has(imp.source)) {
      newImports.set(imp.source, new Map());
    }
    const existing = newImports.get(imp.source)!;
    const entry = existing.get(imp.imported);
    existing.set(imp.imported, {
      local: imp.local ?? imp.imported,
      isType: entry ? entry.isType && imp.isType !== false : imp.isType !== false,
    });
  }

  const defaultModelPrefix = `${options.projectName}/models/`;

  function resolveModelName(imp: { source: string }): string | null {
    const resolved = normalizeClassicImport(options, imp.source, currentFilePath);
    const isModel =
      isModelImportPath(imp.source, options) ||
      (resolved && isModelImportPath(resolved, options)) ||
      imp.source.startsWith(defaultModelPrefix) ||
      (resolved && resolved.startsWith(defaultModelPrefix));
    if (!isModel) return null;
    return (resolved ?? imp.source).split('/').pop()!;
  }

  for (const field of fields) {
    if (field.typeInfo?.declarations) {
      field.typeInfo.declarations.forEach((decl) => declarations.add(decl));
    }
    if (field.kind === 'belongsTo' || field.kind === 'hasMany') {
      if (field.typeInfo?.imports) {
        for (const imp of field.typeInfo.imports) {
          if (!imp.source) {
            throw new Error(`Import information is missing source for field ${field.name}`);
          }
          const modelName = resolveModelName(imp);
          if (modelName && (modelName === field.type || relationshipTypes.has(modelName))) {
            continue;
          }

          addImport(imp);
        }
      } else if (field.kind === 'hasMany') {
        const isAsync = field.options && field.options.async === true;
        if (isAsync) {
          hasAsyncHasMany = true;
        } else {
          hasHasMany = true;
        }
      }

      if (field.type && field.type !== selfName) {
        const typeName = toPascalCase(field.type);
        finalImports.add(transformModelToResourceImport(field.type, typeName, options, registry));
      }
    } else if (field.typeInfo?.imports) {
      for (const imp of field.typeInfo.imports) {
        const modelName = imp.source ? resolveModelName(imp) : null;
        if (modelName && relationshipTypes.has(modelName)) {
          continue;
        }
        addImport(imp);
      }
    }
  }

  if (asyncHasManyImport.source !== hasManyImport.source) {
    if (hasAsyncHasMany) {
      imports.add(`import type { AsyncHasMany } from '${asyncHasManyImport.source}'`);
    }
    if (hasHasMany) {
      imports.add(`import type { HasMany } from '${hasManyImport.source}'`);
    }
  } else if (hasAsyncHasMany && hasHasMany) {
    imports.add(`import type { AsyncHasMany, HasMany } from '${asyncHasManyImport.source}'`);
  } else if (hasAsyncHasMany) {
    imports.add(`import type { AsyncHasMany } from '${asyncHasManyImport.source}'`);
  } else if (hasHasMany) {
    imports.add(`import type { HasMany } from '${hasManyImport.source}'`);
  }

  for (const [source, tokens] of newImports) {
    const typeTokens: string[] = [];
    const valueTokens: string[] = [];
    for (const [imported, { local, isType }] of tokens) {
      const specifier = imported === local ? imported : `${imported} as ${local}`;
      (isType ? typeTokens : valueTokens).push(specifier);
    }
    if (typeTokens.length > 0) {
      imports.add(`import type { ${typeTokens.join(', ')} } from '${source}'`);
    }
    if (valueTokens.length > 0) {
      imports.add(`import { ${valueTokens.join(', ')} } from '${source}'`);
    }
  }

  for (const importStatement of finalImports) {
    imports.add(importStatement);
  }
}

/**
 * Collect trait interface imports.
 * When checkExistence is true, skips traits whose .schema files don't exist on disk.
 */
export function collectTraitImports(
  traits: string[],
  imports: Set<string>,
  options?: TransformOptions,
  checkExistence = false
): void {
  for (const trait of traits) {
    if (checkExistence && options?.traitsDir) {
      const traitSchemaTs = join(options.traitsDir, `${trait}.schema.ts`);
      const traitSchemaJs = join(options.traitsDir, `${trait}.schema.js`);
      const traitTypeTs = join(options.traitsDir, `${trait}.type.ts`);
      if (!existsSync(traitSchemaTs) && !existsSync(traitSchemaJs) && !existsSync(traitTypeTs)) {
        log.debug(`Skipping trait import for '${trait}' - file does not exist at ${traitSchemaTs}`);
        continue;
      }
    }

    const traitImport = generateTraitImport(trait, options);
    imports.add(traitImport);
  }
}

export interface FieldTypeInfo {
  name: string;
  transformInferredType: string;
  comment?: string;
  typeInfo: ExtractedType | null;
}

/**
 * Map SchemaField[] to type properties for interface generation.
 */
export function mapFieldsToTypeProperties(fields: SchemaField[], options?: TransformOptions): Array<FieldTypeInfo> {
  return fields.map((field) => ({
    name: field.name,
    transformInferredType: schemaFieldToTypeScriptType(field, options),
    comment: field.comment,
    typeInfo: field.typeInfo || null,
  }));
}

/**
 * Build a trait schema object from fields and traits.
 * Used by both mixin and intermediate-model trait generation.
 */
export function buildTraitSchemaObject(
  fields: SchemaField[],
  traits: string[],
  extra?: { name?: string; mode?: string; legacyFieldOrder?: boolean }
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  if (extra?.name) {
    obj.name = extra.name;
  }
  if (extra?.mode) {
    obj.mode = extra.mode;
  }

  obj.fields = extra?.legacyFieldOrder
    ? fields.map(schemaFieldToLegacyFormat)
    : fields.map((field) => ({
        name: field.name,
        kind: field.kind,
        ...(field.type ? { type: field.type } : {}),
        ...(field.options && Object.keys(field.options).length > 0 ? { options: field.options } : {}),
      }));

  if (traits.length > 0) {
    obj.traits = traits;
  }

  return obj;
}

/**
 * Options for generating merged schema with types
 */
export interface MergedSchemaOptions {
  /**
   * The {@link ArtifactConfig} config for the resource being generated.
   */
  config: ArtifactConfig;
  /** The schema object to export */
  schemaObject: Record<string, unknown>;
  /** Properties for the interface */
  properties: Array<FieldTypeInfo>;
  /** Traits that this interface extends */
  traits?: string[];
  /** Import statements needed for types */
  imports?: Set<string>;
  /** Transform options */
  options: TransformOptions;
  /** Doc comment for the interface */
  comment?: string;
  /**
   * Optional export declarations (e.g. `export const BIRTHAGE = 0;`) to inject
   * into the schema file before the schema const. These are constants referenced
   * by identifier in schema field options.
   */
  constantDeclarations?: string;
}

/**
 * Generate TypeScript import statements
 */
function generateTypeScriptImports(imports: Set<string>, config: TransformOptions): string {
  if (imports.size === 0) return '';

  const lines: string[] = [];
  for (const importStatement of imports) {
    // Ensure proper formatting
    if (importStatement.startsWith('import ')) {
      lines.push(`${importStatement};`);
    } else {
      lines.push(`import ${importStatement};`);
    }
  }

  lines.push(''); // Add a blank line after imports
  return lines.join('\n');
}

/**
 * Generate the schema const declaration
 */
function generateSchemaDeclaration(
  config: ArtifactConfig,
  schemaObject: Record<string, unknown>,
  options: TransformOptions
): string {
  let jsonString = JSON.stringify(schemaObject, null, 2);

  // Always use single quotes
  jsonString = jsonString.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");

  // Unescape identifier code references: '__ref__:IDENT' → IDENT (unquoted)
  jsonString = jsonString.replace(new RegExp(`'${SCHEMA_OPTION_REF_PREFIX}([^']+)'`, 'g'), '$1');

  const withDefaultsImport =
    config.type === 'resource' && !config.isFragment ? getConfiguredImport(options, 'withDefaults') : undefined;
  const value = withDefaultsImport ? `${withDefaultsImport.imported}(${jsonString})` : jsonString;

  if (config.schemaIsTyped && !withDefaultsImport) {
    const satisfiesType = config.type === 'trait' ? 'LegacyTrait' : 'LegacyResourceSchema';
    return `const ${config.identifiers.schema} = ${value} satisfies ${satisfiesType};`;
  } else {
    return `const ${config.identifiers.schema} = ${value};`;
  }
}

function cleanComment(comment: string, includeBreak = true): string {
  const lines = comment.split('\n').map((l) => l.trim());
  if (lines[0].startsWith('/**')) {
    lines[0] = lines[0].replace('/**', '').trim();
  }
  if (lines[lines.length - 1].endsWith('*/')) {
    lines[lines.length - 1] = lines[lines.length - 1].replace('*/', '').trim();
  }
  if (lines.length > 2) {
    for (let i = 1; i < lines.length - 1; i++) {
      if (lines[i].startsWith('*')) {
        lines[i] = lines[i].slice(1).trim();
      }
    }
    if (lines[0] === '') {
      lines.shift();
    }
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
  }
  if (includeBreak) {
    lines.push('', '---', '');
  }
  return lines.map((l) => ` * ${l}`).join('\n');
}

const ResourceTipComment = ` * > [!TIP]
 * > It is likely that you will want a more specific type tailored
 * > to the context of where some data has been loaded, for instance
 * > one that marks specific fields as readonly, or which only enables
 * > some fields to be null during create, or which only includes
 * > a subset of fields based on a specific API response.
 * >
 * > For those cases, you can create a more specific type that derives
 * > from this type to ensure that your type definitions stay consistent
 * > with the schema. For more details read about {@link https://warp-drive.io/api/@warp-drive/core/types/record/type-aliases/Mask | Masking}`;

/**
 * Generate TypeScript interface code (without imports - they're handled separately)
 */
function generateInterfaceOnly(
  options: TransformOptions,
  config: ArtifactConfig,
  comment: string | undefined,
  properties: Array<FieldTypeInfo>,
  indent = '  '
): string {
  /**
   * Each resource will export 2 types to support itself
   * and 2 to support its extension (if needed).
   */
  /**
   * The primary fields definition e.g.
   *
   * ```
   * export interface UserResource extends TimestamppedTrait {
   *   id: string | null;
   *   name: string;
   * }
   * ```
   */
  let interfaceDeclaration = `export interface ${config.identifiers.fieldsInterface}`;
  if (config.traits.length) {
    interfaceDeclaration += ' extends ';
    interfaceDeclaration += config.traits.map((t) => t.identifiers.fieldsInterface).join(', ');
  }
  interfaceDeclaration += ' {';

  /**
   * The fields + the legacy Model capabilities e.g.
   *
   * ```
   * export interface User extends WithLegacy<UserResource> {}
   * ```
   */
  const fullTypeDeclaration = `export interface ${config.identifiers.type} extends WithLegacy<${config.identifiers.fieldsInterface}> {}`;

  /**
   * Cleanup any existing documentation for this resource for re-use in the generated interfaces.
   */
  const docComment = comment ? `/**\n` + cleanComment(comment) : `/**`;
  /**
   * Add helpful usage tips if desired.
   */
  const tipComment = options.disableAddingTypeUsageTips ? ' *' : ' *\n' + ResourceTipComment;
  /**
   * The documentation for "just the fields"
   */
  const seeAlso =
    config.type === 'resource'
      ? `\n *\n * See also {@link ${config.identifiers.type}} for fields + legacy mode features`
      : '';
  const fieldsInterfaceComment = `${docComment}
 * This type represents the full set schema derived fields of
 * the '${config.name}' ${config.type}, without any of the legacy mode features
 * and without any extensions.
${tipComment}${seeAlso}
 */`;
  /**
   * The documentation for the "fields + legacy mode features" interface
   *
   * Extensions will be handled separately.
   */
  const fullInterfaceComment = `${docComment}
 * This type represents the full set schema derived fields of
 * the '${config.name}' ${config.type}, including all legacy mode features but
 * without any extensions.
 *
 * See also {@link ${config.identifiers.fieldsInterface}} for just the fields
 */`;

  const lines: string[] = [fieldsInterfaceComment, interfaceDeclaration];

  // Add properties
  for (const prop of properties) {
    if (prop.comment) {
      const commentLines = cleanComment(prop.comment, false).split('\n');
      commentLines.unshift('/**');
      commentLines.push(' */');
      const formattedComment = commentLines.join(`\n${indent}`);
      lines.push('', `${indent}${formattedComment}`);
    }

    const readonly = prop.typeInfo?.readonly ? 'readonly ' : '';
    // if we don't have typeInfo, the property is always optional
    const optional = !prop.typeInfo || prop.typeInfo.optional ? '?' : '';
    // use the type from the declared type, else use an inferred type
    const type = prop.typeInfo?.type || prop.transformInferredType || 'unknown';

    lines.push(`${indent}${readonly}${prop.name}${optional}: ${type};`);
  }

  lines.push('}');

  // Only resources get the WithLegacy wrapper interface; traits don't use it
  if (config.type === 'resource') {
    lines.push('', fullInterfaceComment, fullTypeDeclaration, '');
  } else {
    lines.push('');
  }

  return lines.join('\n');
}

interface GeneratedSchemaParts {
  typeImports: string | null;
  schemaImports: string | null;
  schemaDeclaration: string | null;
  interfaceDeclaration: string | null;
}

/**
 * Generate a merged schema file containing both the schema object and type interface
 * This creates a single .schema.js or .schema.ts file with everything needed
 */
export function generateMergedSchemaCode(opts: MergedSchemaOptions): GeneratedSchemaParts {
  const { config, schemaObject, properties, comment, options, imports = new Set() } = opts;

  const parts: GeneratedSchemaParts = {
    typeImports: null,
    schemaImports: null,
    schemaDeclaration: null,
    interfaceDeclaration: null,
  };

  const schemaImportParts: string[] = [];
  const withDefaultsImport =
    config.type === 'resource' && !config.isFragment ? getConfiguredImport(opts.options, 'withDefaults') : undefined;

  if (!opts.options?.disableTypescriptSchemas && !withDefaultsImport) {
    const schemaTypeKey = config.type === 'trait' ? 'LegacyTrait' : 'LegacyResourceSchema';
    const importLocation = getConfiguredImport(opts.options, schemaTypeKey);
    schemaImportParts.push(`import type { ${importLocation.imported} } from '${importLocation.source}';`);
  }
  if (withDefaultsImport) {
    schemaImportParts.push(`import { ${withDefaultsImport.imported} } from '${withDefaultsImport.source}';`);
  }

  if (schemaImportParts.length > 0) {
    parts.schemaImports = schemaImportParts.join('\n') + '\n';
  }

  // Generate imports section (only for TypeScript)
  if (config.hasTypes) {
    const importsCode = generateTypeScriptImports(imports, opts.options);
    parts.typeImports = importsCode;
  }

  // Generate schema declaration (optionally preceded by constant declarations)
  const schemaDecl = generateSchemaDeclaration(config, schemaObject, opts.options);
  const constPrefix = opts.constantDeclarations ? `${opts.constantDeclarations}\n\n` : '';
  parts.schemaDeclaration = `${constPrefix}${schemaDecl}\n\nexport default ${config.identifiers.schema};\n`;

  if (config.hasTypes) {
    // if (useComposite) {
    //   // Composite pattern: field interface is {Name}Trait, composite is {Name}
    //   const fieldInterfaceName = `${interfaceName}Trait`;
    //   const fieldInterfaceCode = generateInterfaceOnly(fieldInterfaceName, properties);
    //   sections.push('');
    //   sections.push(fieldInterfaceCode);

    //   // Composite interface merges field interface, extension, and trait interfaces
    //   const traitInterfaces = traits.map(traitNameToInterfaceName);
    //   const compositeExtends = [fieldInterfaceName, extensionName, ...traitInterfaces].join(', ');
    //   sections.push('');
    //   sections.push(`export interface ${interfaceName} extends ${compositeExtends} {}`);
    // } else {
    //   // Standard pattern: single interface with optional trait extends
    //   let extendsClause: string | undefined;
    //   if (traits.length > 0) {
    //     const traitInterfaces = traits.map(traitNameToInterfaceName);
    //     extendsClause = traitInterfaces.join(', ');
    //   }

    //   const interfaceCode = generateInterfaceOnly(interfaceName, properties, extendsClause);
    //   sections.push('');
    //   sections.push(interfaceCode);
    // }

    const interfaceCode = generateInterfaceOnly(options, config, comment, properties);
    parts.interfaceDeclaration = interfaceCode;
  }

  return parts;
}

/**
 * Build the trait schema artifact and (when types are separate) the
 * trait-type artifact from pre-generated merged schema parts.
 *
 * This is the shared logic used by mixin.ts and the two
 * model-as-trait code paths in model.ts.
 */
export function buildTraitArtifacts(
  mergedSchemaCode: GeneratedSchemaParts,
  config: ArtifactConfig,
  baseName: string,
  options: TransformOptions
): TransformArtifact[] {
  const hasType = mergedSchemaCode.interfaceDeclaration && mergedSchemaCode.interfaceDeclaration.trim() !== '';
  const includeTypesInSchema = options.combineSchemasAndTypes || !hasType;

  const artifacts: TransformArtifact[] = [
    {
      type: 'trait',
      name: config.identifiers.schema,
      code: [
        mergedSchemaCode.schemaImports,
        includeTypesInSchema ? mergedSchemaCode.typeImports : null,
        mergedSchemaCode.schemaDeclaration,
        includeTypesInSchema ? mergedSchemaCode.interfaceDeclaration : null,
      ]
        .filter(Boolean)
        .join('\n'),
      baseName,
      suggestedFileName: `${baseName}.schema${config.schemaIsTyped ? '.ts' : '.js'}`,
    },
  ];

  if (!options.combineSchemasAndTypes && hasType) {
    artifacts.push({
      type: 'trait-type',
      name: config.identifiers.fieldsInterface!,
      code: [mergedSchemaCode.typeImports, mergedSchemaCode.interfaceDeclaration].filter(Boolean).join('\n'),
      baseName,
      suggestedFileName: `${baseName}.type.ts`,
    });
  }

  return artifacts;
}
