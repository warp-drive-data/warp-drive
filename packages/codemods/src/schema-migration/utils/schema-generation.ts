import type { SgNode } from '@ast-grep/napi';
import { existsSync } from 'fs';
import { join } from 'path';

import { logger } from '../../../utils/logger.js';
import { getConfiguredImport, type TransformOptions } from '../config.js';
import { parseObjectLiteralFromNode } from './ast-helpers.js';
import type { ExtensionContext } from './extension-generation.js';
import { getExtensionArtifactType } from './extension-generation.js';
import { generateTraitImport, transformModelToResourceImport } from './import-utils.js';
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
  isFragment?: boolean
): Record<string, unknown> {
  const legacySchema: Record<string, unknown> = {
    type: isFragment ? `fragment:${type}` : type,
    legacy: true,
    identity: isFragment ? null : { kind: '@id', name: 'id' },
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
  interfaceName: string,
  interfaceFieldsName: string,
  comment: string | undefined,
  properties: Array<FieldTypeInfo>,
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

  lines.push(generateInterfaceOnly(interfaceName, interfaceFieldsName, comment, properties, extendsClause, '\t'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Create type artifact for interfaces
 */
export function createTypeArtifact(
  baseName: string,
  interfaceName: string,
  interfaceFieldsName: string,
  comment: string | undefined,
  properties: Array<FieldTypeInfo>,
  artifactContext?: 'resource' | 'extension' | 'trait',
  extendsClause?: string,
  imports?: string[],
  fileExtension?: string
): TransformArtifact {
  const code = generateInterfaceCode(interfaceName, interfaceFieldsName, comment, properties, extendsClause, imports);

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
    baseName,
    suggestedFileName: extFileName,
  };

  // Type artifacts are no longer generated separately - types are merged into schema files
  return { extensionArtifact, typeArtifact: null };
}

function modelImportFor(modelName: string, options: TransformOptions): string {
  return `${options.projectName}/models/${modelName}`;
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
  options: TransformOptions
): void {
  const asyncHasManyImport = getConfiguredImport(options, 'AsyncHasMany');
  const hasManyImport = getConfiguredImport(options, 'HasMany');
  let hasAsyncHasMany = false;
  let hasHasMany = false;
  const newImports = new Map<string, Map<string, string>>();
  const finalImports = new Set<string>();

  for (const field of fields) {
    if (field.typeInfo?.declarations) {
      field.typeInfo.declarations.forEach((decl) => declarations.add(decl));
    }
    if (field.kind === 'belongsTo' || field.kind === 'hasMany') {
      if (field.typeInfo?.imports) {
        const relatedModelImport = modelImportFor(field.type!, options);
        for (const imp of field.typeInfo.imports) {
          // check if the source is perhaps a Model from before, and if so don't
          // add it.
          // to do this we check for local imports, app prefixed imports and relative imports
          // that match the related model type.
          if (!imp.source) {
            throw new Error(`Import information is missing source for field ${field.name}`);
          }
          const resolved = normalizeClassicImport(options, imp.source, currentFilePath);
          if (resolved === relatedModelImport) {
            continue;
          }

          if (!newImports.has(imp.source)) {
            newImports.set(imp.source, new Map<string, string>());
          }
          const existingImport = newImports.get(imp.source)!;
          existingImport.set(imp.imported, imp.local ?? imp.imported);
        }
      } else if (field.kind === 'hasMany') {
        const isAsync = field.options && field.options.async === true;
        if (isAsync) {
          hasAsyncHasMany = true;
        } else {
          hasHasMany = true;
        }
      }

      if (field.type !== selfName) {
        const typeName = toPascalCase(field.type!);
        finalImports.add(transformModelToResourceImport(field.type!, typeName, options));
      }
    } else if (field.typeInfo?.imports) {
      for (const imp of field.typeInfo.imports) {
        if (!newImports.has(imp.source)) {
          newImports.set(imp.source, new Map<string, string>());
        }
        const existingImport = newImports.get(imp.source)!;
        existingImport.set(imp.imported, imp.local ?? imp.imported);
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
    const importsList = [...tokens.entries()].map(([imported, local]) =>
      imported === local ? imported : `${imported} as ${local}`
    );
    const importStatement = `import type { ${importsList.join(', ')} } from '${source}'`;
    imports.add(importStatement);
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
      const traitFilePath = join(options.traitsDir, `${trait}.schema.ts`);
      const traitFilePathJs = join(options.traitsDir, `${trait}.schema.js`);
      if (!existsSync(traitFilePath) && !existsSync(traitFilePathJs)) {
        log.debug(`Skipping trait import for '${trait}' - file does not exist at ${traitFilePath}`);
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
  /** The base name of the resource (kebab-case, e.g., 'user') */
  baseName: string;
  /**
   * The name of the interface for the schema fields (e.g., 'UserFields').
   * This is separate from the exported interface name to allow for
   * additional decoration via wrappers, for instance WithLegacy<UserFields>.
   */
  interfaceFieldsName: string;
  /** The interface name (PascalCase, e.g., 'LegacyUser') */
  interfaceName: string;
  /** The schema variable name (e.g., 'UserSchema') */
  schemaName: string;
  /** The schema object to export */
  schemaObject: Record<string, unknown>;
  /** Properties for the interface */
  properties: Array<FieldTypeInfo>;
  /** Traits that this interface extends */
  traits?: string[];
  /** Import statements needed for types */
  imports?: Set<string>;
  /** Whether this is a TypeScript file */
  isTypeScript: boolean;
  /** Transform options */
  options: TransformOptions;
  /** Extension name (e.g., 'UserExtension') -> when set with traits, triggers composite interface pattern */
  extensionName?: string;
  /** Doc comment for the interface */
  comment?: string;
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
  schemaName: string,
  schemaObject: Record<string, unknown>,
  isTypeScript: boolean
): string {
  let jsonString = JSON.stringify(schemaObject, null, 2);

  // Always use single quotes
  jsonString = jsonString.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");

  if (isTypeScript) {
    return `const ${schemaName} = ${jsonString} satisfies LegacyResourceSchema;`;
  } else {
    return `const ${schemaName} = ${jsonString};`;
  }
}

/**
 * Generate TypeScript interface code (without imports - they're handled separately)
 */
function generateInterfaceOnly(
  interfaceName: string,
  interfaceFieldsName: string,
  comment: string | undefined,
  properties: Array<FieldTypeInfo>,
  extendsClause?: string,
  indent = '  '
): string {
  const lines: string[] = [];

  // Add interface declaration
  let interfaceDeclaration = `interface ${interfaceFieldsName}`;
  if (extendsClause) {
    interfaceDeclaration += ` extends ${extendsClause}`;
  }
  interfaceDeclaration += ' {';
  lines.push(interfaceDeclaration);

  // Add properties
  properties.forEach((prop) => {
    if (prop.comment) {
      const formattedComment = prop.comment.startsWith('/**') ? prop.comment : `/** ${prop.comment} */`;
      lines.push(`${indent}${formattedComment}`);
    }

    const readonly = prop.typeInfo?.readonly ? 'readonly ' : '';
    // if we don't have typeInfo, the property is always optional
    const optional = !prop.typeInfo || prop.typeInfo.optional ? '?' : '';
    // use the type from the declared type, else use an inferred type
    const type = prop.typeInfo?.type || prop.transformInferredType || 'unknown';

    lines.push(`${indent}${readonly}${prop.name}${optional}: ${type};`);
  });

  lines.push('}', '');
  if (comment) {
    lines.push(comment.startsWith('/**') ? comment : `/** ${comment} */`);
  }
  lines.push(`export interface ${interfaceName} extends WithLegacy<${interfaceFieldsName}> {}`, '');

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
  const {
    baseName,
    schemaName,
    interfaceName,
    interfaceFieldsName,
    schemaObject,
    properties,
    comment,
    traits = [],
    imports = new Set(),
    isTypeScript,
    options,
    extensionName,
  } = opts;

  const useComposite = isTypeScript && Boolean(extensionName) && traits.length > 0;

  const parts: GeneratedSchemaParts = {
    typeImports: null,
    schemaImports: null,
    schemaDeclaration: null,
    interfaceDeclaration: null,
  };

  if (!opts.options?.disableTypescriptSchemas) {
    const importLocation = getConfiguredImport(opts.options!, 'LegacyResourceSchema');
    parts.schemaImports = `import { ${importLocation.imported} } from '${importLocation.source}';\n`;
  }

  if (useComposite) {
    const extensionImportPath = options?.resourcesImport
      ? `${options.resourcesImport}/${baseName}.ext`
      : `../resources/${baseName}.ext`;
    imports.add(`type { ${extensionName} } from '${extensionImportPath}'`);
  }

  // Generate imports section (only for TypeScript)
  if (isTypeScript) {
    const importsCode = generateTypeScriptImports(imports, opts.options);
    parts.typeImports = importsCode;
  }

  // Generate schema declaration
  const schemaDecl = generateSchemaDeclaration(schemaName, schemaObject, !opts.options?.disableTypescriptSchemas);
  parts.schemaDeclaration = `${schemaDecl}\n\nexport default ${schemaName};\n`;

  if (isTypeScript) {
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

    // Standard pattern: single interface with optional trait extends
    let extendsClause: string | undefined;
    if (traits.length > 0) {
      const traitInterfaces = traits.map(traitNameToInterfaceName);
      extendsClause = traitInterfaces.join(', ');
    }

    const interfaceCode = generateInterfaceOnly(interfaceName, interfaceFieldsName, comment, properties, extendsClause);
    parts.interfaceDeclaration = interfaceCode;
  }

  return parts;
}
