import type { SgNode } from '@ast-grep/napi';
import { existsSync } from 'fs';
import { join } from 'path';

import type { TransformOptions } from '../config.js';
import { parseObjectLiteralFromNode } from './ast-helpers.js';
import type { ExtensionContext } from './extension-generation.js';
import { getExtensionArtifactType } from './extension-generation.js';
import { generateCommonWarpDriveImports, generateTraitImport, transformModelToResourceImport } from './import-utils.js';
import { debugLog } from './logging.js';
import { removeQuotes, toPascalCase } from './path-utils.js';
import type { ExtractedType } from './type-utils.js';
import { schemaFieldToTypeScriptType } from './type-utils.js';

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
  typeInfo?: ExtractedType;
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
  isFragment?: boolean
): Record<string, unknown> {
  const legacySchema: Record<string, unknown> = {
    type: isFragment ? `fragment:${type}` : type,
    legacy: true,
    identity: isFragment ? null : { kind: '@id', name: 'id' },
    fields: schemaFields.map(schemaFieldToLegacyFormat),
  };

  if (mixinTraits.length > 0) {
    legacySchema.traits = mixinTraits;
  }

  if (mixinExtensions.length > 0 || isFragment) {
    const fragmentExtensions = isFragment ? ['ember-object', 'fragment'] : [];
    legacySchema.objectExtensions = [...fragmentExtensions, ...mixinExtensions];
  }

  return legacySchema;
}

/**
 * Parse options object from an AST node for schema field conversion
 * Returns the parsed options object
 */
function parseSchemaFieldOptions(optionsNode: SgNode | undefined): Record<string, unknown> {
  if (!optionsNode || optionsNode.kind() !== 'object') {
    return {};
  }

  try {
    return parseObjectLiteralFromNode(optionsNode);
  } catch {
    return {};
  }
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
      };
    }
    case 'belongsTo': {
      const type = firstArg ? removeQuotes(firstArg) : undefined;
      return {
        name,
        kind: getFieldKindFromDecorator('belongsTo') as 'belongsTo',
        type,
        options: Object.keys(options).length > 0 ? options : undefined,
      };
    }
    case 'hasMany': {
      const type = firstArg ? removeQuotes(firstArg) : undefined;
      return {
        name,
        kind: getFieldKindFromDecorator('hasMany') as 'hasMany',
        type,
        options: Object.keys(options).length > 0 ? options : undefined,
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
  interfaceName: string,
  properties: Array<{
    name: string;
    type: string;
    readonly?: boolean;
    optional?: boolean;
    comment?: string;
  }>,
  extendsClause?: string,
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

  // Add interface declaration
  let interfaceDeclaration = `export interface ${interfaceName}`;
  if (extendsClause) {
    interfaceDeclaration += ` extends ${extendsClause}`;
  }
  interfaceDeclaration += ' {';
  lines.push(interfaceDeclaration);

  // Add properties
  properties.forEach((prop) => {
    if (prop.comment) {
      // Wrap comment in JSDoc format if not already formatted
      const formattedComment = prop.comment.startsWith('/**') ? prop.comment : `/** ${prop.comment} */`;
      lines.push(`	${formattedComment}`);
    }

    const readonly = prop.readonly ? 'readonly ' : '';
    const optional = prop.optional ? '?' : '';

    lines.push(`	${readonly}${prop.name}${optional}: ${prop.type};`);
  });

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Create type artifact for interfaces
 */
export function createTypeArtifact(
  baseName: string,
  interfaceName: string,
  properties: Array<{
    name: string;
    type: string;
    readonly?: boolean;
    optional?: boolean;
    comment?: string;
  }>,
  artifactContext?: 'resource' | 'extension' | 'trait',
  extendsClause?: string,
  imports?: string[],
  fileExtension?: string
): TransformArtifact {
  const code = generateInterfaceCode(interfaceName, properties, extendsClause, imports);

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

  const extensionName = entityName.endsWith('Extension') ? entityName : `${entityName}Extension`;

  // Use provided generator or create a simple fallback
  const generator =
    generateExtensionCode ||
    ((name, props, format) => {
      if (format === 'class') {
        const methods = props.map((p) => `  ${p.value}`).join('\n\n');
        return `export class ${name} {\n${methods}\n}`;
      }
      const properties = props.map((p) => `  ${p.originalKey}: ${p.value}`).join(',\n');
      return `export const ${name} = {\n${properties}\n};`;
    });

  // Create the extension artifact (JavaScript code)
  const extensionCode = generator(extensionName, extensionProperties, extensionFormat);

  // Use .ext suffix for extension files
  const ext = fileExtension || '.ts';
  const extFileName = `${baseName}.ext${ext}`;

  const extensionArtifact: TransformArtifact = {
    type: getExtensionArtifactType(context),
    name: extensionName,
    code: extensionCode,
    suggestedFileName: extFileName,
  };

  // Type artifacts are no longer generated separately - types are merged into schema files
  return { extensionArtifact, typeArtifact: null };
}

/**
 * Collect relationship imports (belongsTo/hasMany) for schema fields.
 * Shared between model and mixin artifact generation.
 */
export function collectRelationshipImports(
  fields: SchemaField[],
  selfName: string,
  imports: Set<string>,
  options?: TransformOptions
): void {
  const commonImports = generateCommonWarpDriveImports(options);

  for (const field of fields) {
    if (field.kind === 'belongsTo' || field.kind === 'hasMany') {
      if (field.type && field.type !== selfName) {
        const typeName = toPascalCase(field.type);
        imports.add(transformModelToResourceImport(field.type, typeName, options));

        if (field.kind === 'hasMany') {
          const isAsync = field.options && field.options.async === true;
          if (isAsync) {
            imports.add(commonImports.asyncHasManyImport);
          } else {
            imports.add(commonImports.hasManyImport);
          }
        }
      }
    }
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
      const traitFilePath = join(options.traitsDir, `${trait}.schema.ts`);
      const traitFilePathJs = join(options.traitsDir, `${trait}.schema.js`);
      if (!existsSync(traitFilePath) && !existsSync(traitFilePathJs)) {
        debugLog(options, `Skipping trait import for '${trait}' - file does not exist at ${traitFilePath}`);
        continue;
      }
    }

    const traitImport = generateTraitImport(trait, options);
    imports.add(traitImport);
  }
}

/**
 * Map SchemaField[] to type properties for interface generation.
 */
export function mapFieldsToTypeProperties(
  fields: SchemaField[],
  options?: TransformOptions,
  readonlyFields = true
): Array<{ name: string; type: string; readonly: boolean; comment?: string }> {
  return fields.map((field) => ({
    name: field.name,
    type: schemaFieldToTypeScriptType(field, options),
    readonly: readonlyFields,
    comment: field.comment,
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
  /** The base name of the resource (kebab-case, e.g., 'user') */
  baseName: string;
  /** The interface name (PascalCase, e.g., 'User') */
  interfaceName: string;
  /** The schema variable name (e.g., 'UserSchema') */
  schemaName: string;
  /** The schema object to export */
  schemaObject: Record<string, unknown>;
  /** Properties for the interface */
  properties: Array<{
    name: string;
    type: string;
    readonly?: boolean;
    optional?: boolean;
    comment?: string;
  }>;
  /** Traits that this interface extends */
  traits?: string[];
  /** Import statements needed for types */
  imports?: Set<string>;
  /** Whether this is a TypeScript file */
  isTypeScript: boolean;
  /** Transform options */
  options?: TransformOptions;
}

/**
 * Convert trait name (kebab-case) to interface name (PascalCase + 'Trait' suffix)
 */
function traitNameToInterfaceName(traitName: string): string {
  return `${toPascalCase(traitName)}Trait`;
}

/**
 * Generate TypeScript import statements
 */
function generateTypeScriptImports(imports: Set<string>): string {
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
  return lines.join('\n');
}

/**
 * Generate the schema const declaration
 */
function generateSchemaDeclaration(
  schemaName: string,
  schemaObject: Record<string, unknown>,
  isTypeScript: boolean
): string {
  let jsonString = JSON.stringify(schemaObject, null, 2);

  // Always use single quotes
  jsonString = jsonString.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");

  if (isTypeScript) {
    return `const ${schemaName} = ${jsonString} as const;`;
  } else {
    return `const ${schemaName} = ${jsonString};`;
  }
}

/**
 * Generate TypeScript interface code (without imports - they're handled separately)
 */
function generateInterfaceOnly(
  interfaceName: string,
  properties: Array<{
    name: string;
    type: string;
    readonly?: boolean;
    optional?: boolean;
    comment?: string;
  }>,
  extendsClause?: string
): string {
  const lines: string[] = [];

  // Add interface declaration
  let interfaceDeclaration = `export interface ${interfaceName}`;
  if (extendsClause) {
    interfaceDeclaration += ` extends ${extendsClause}`;
  }
  interfaceDeclaration += ' {';
  lines.push(interfaceDeclaration);

  // Add properties
  properties.forEach((prop) => {
    if (prop.comment) {
      const formattedComment = prop.comment.startsWith('/**') ? prop.comment : `/** ${prop.comment} */`;
      lines.push(`  ${formattedComment}`);
    }

    const readonly = prop.readonly ? 'readonly ' : '';
    const optional = prop.optional ? '?' : '';

    lines.push(`  ${readonly}${prop.name}${optional}: ${prop.type};`);
  });

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate a merged schema file containing both the schema object and type interface
 * This creates a single .schema.js or .schema.ts file with everything needed
 */
export function generateMergedSchemaCode(opts: MergedSchemaOptions): string {
  const { schemaName, interfaceName, schemaObject, properties, traits = [], imports = new Set(), isTypeScript } = opts;

  const sections: string[] = [];

  // Generate imports section (only for TypeScript)
  if (isTypeScript) {
    const importsCode = generateTypeScriptImports(imports);
    if (importsCode) {
      sections.push(importsCode);
    }
  }

  // Generate schema declaration
  const schemaDecl = generateSchemaDeclaration(schemaName, schemaObject, isTypeScript);
  sections.push(schemaDecl);

  // Generate default export
  sections.push(`\nexport default ${schemaName};`);

  // Generate interface (only for TypeScript)
  if (isTypeScript) {
    // Build extends clause from traits
    let extendsClause: string | undefined;
    if (traits.length > 0) {
      const traitInterfaces = traits.map(traitNameToInterfaceName);
      extendsClause = traitInterfaces.join(', ');
    }

    const interfaceCode = generateInterfaceOnly(interfaceName, properties, extendsClause);
    sections.push('');
    sections.push(interfaceCode);
  }

  return sections.join('\n');
}
