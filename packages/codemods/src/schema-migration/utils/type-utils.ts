import type { SgNode } from '@ast-grep/napi';

import { logger } from '../../../utils/logger.js';
import type { PackageImport, TransformOptions } from '../config.js';
import { parseObjectLiteralFromNode } from './ast-helpers.js';
import { DEFAULT_EMBER_DATA_SOURCE, DEFAULT_MIXIN_SOURCE } from './import-utils.js';
import { removeQuotes, toPascalCase } from './path-utils.js';

const log = logger.for('type-utils');
// logger.prototype.constructor.options = {
//   verbose: '2',
//   logFile: true,
// };

// Re-export constants for backward compatibility
export { DEFAULT_EMBER_DATA_SOURCE, DEFAULT_MIXIN_SOURCE };

/**
 * Built-in type mappings for EmberData transforms
 * Only these four types are directly supported
 */
export const BUILT_IN_TYPE_MAPPINGS: Record<string, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'Date',
};

/**
 * Interface representing a TypeScript type extracted from the AST
 */
export interface ExtractedType {
  /** The TypeScript type annotation (e.g., 'string | null', 'User[]') */
  type: string;
  /** Whether this is a readonly property */
  readonly?: boolean;
  /** Whether this property is optional */
  optional?: boolean;
  /** Import dependencies needed for this type */
  imports?: PackageImport[];
  /** Type declarations needed for this type */
  declarations?: string[];
  /** Names of type alias and interface declarations collected for the type file */
  declarationNames?: string[];
}

/**
 * Get TypeScript type for an EmberData attribute transform type
 * Uses built-in mappings and optional custom type mappings
 */
export function getTypeScriptTypeForAttribute(
  attrType: string,
  hasDefaultValue: boolean,
  allowNull: boolean,
  options?: TransformOptions,
  fieldOptions?: Record<string, unknown>
): { tsType: string; imports?: string[] } {
  // Handle enum types specially
  if (attrType === 'enum' && fieldOptions?.allowedValues) {
    const rawValue = fieldOptions.allowedValues as string;
    // Strip __ref__: prefix used by schema field options for identifier references
    const allowedValues = rawValue.startsWith('__ref__:') ? rawValue.slice('__ref__:'.length) : rawValue;

    // Check if this is a simple identifier (enum name like FrameworkUpdateStatus)
    // If not, fall back to a simple string type instead of trying to generate complex types
    if (!/^[A-Za-z_]\w*$/.test(allowedValues)) {
      const tsType = allowNull ? 'string | null' : 'string';
      return { tsType };
    }

    const tsType = allowNull
      ? `(typeof ${allowedValues})[keyof typeof ${allowedValues}] | null`
      : `(typeof ${allowedValues})[keyof typeof ${allowedValues}]`;
    return { tsType };
  }

  // Check custom type mappings first
  const customMapping = options?.typeMapping?.[attrType];
  if (customMapping) {
    const tsType = hasDefaultValue || !allowNull ? customMapping : `${customMapping} | null`;
    return { tsType };
  }

  // Check built-in type mappings
  const builtInMapping = BUILT_IN_TYPE_MAPPINGS[attrType];
  if (builtInMapping) {
    const tsType = hasDefaultValue || !allowNull ? builtInMapping : `${builtInMapping} | null`;
    return { tsType };
  }

  // Fallback to unknown for unsupported types
  return { tsType: 'unknown' };
}

/**
 * Generate TypeScript type for a belongsTo field
 * Shared between model-to-schema and mixin-to-schema transforms
 */
function getTypeScriptTypeForBelongsTo(
  field: { type?: string; options?: Record<string, unknown> },
  options?: TransformOptions
): string {
  if (!field.type) {
    return 'unknown';
  }

  const isAsync = field.options && field.options.async === true;
  const typeName = toPascalCase(field.type);

  if (isAsync) {
    return `Promise<${typeName}>`;
  }

  // For sync belongsTo relationships, assume nullability by default for safety
  return `${typeName} | null`;
}

/**
 * Generate TypeScript type for a hasMany field
 * Shared between model-to-schema and mixin-to-schema transforms
 */
function getTypeScriptTypeForHasMany(
  field: { type?: string; options?: Record<string, unknown> },
  options?: TransformOptions
): string {
  if (!field.type) {
    return 'unknown';
  }

  const isAsync = field.options && field.options.async === true;
  const typeName = toPascalCase(field.type);

  if (isAsync) {
    return `AsyncHasMany<${typeName}>`;
  }

  return `HasMany<${typeName}>`;
}

/**
 * Schema field interface for type conversion
 */
export interface SchemaFieldForType {
  kind: 'attribute' | 'belongsTo' | 'hasMany' | 'schema-object' | 'schema-array' | 'array';
  type?: string;
  options?: Record<string, unknown>;
}

/**
 * Convert a schema field to its TypeScript type representation
 * Consolidates the duplicated switch-case pattern from model.ts and mixin.ts
 */
export function schemaFieldToTypeScriptType(field: SchemaFieldForType, options?: TransformOptions): string {
  switch (field.kind) {
    case 'attribute':
      return getTypeScriptTypeForAttribute(
        field.type || 'unknown',
        !!(field.options && 'defaultValue' in field.options),
        !field.options || field.options.allowNull !== false,
        options,
        field.options
      ).tsType;
    case 'belongsTo':
      return getTypeScriptTypeForBelongsTo(field, options);
    case 'hasMany':
      return getTypeScriptTypeForHasMany(field, options);
    case 'schema-object':
    case 'schema-array':
    case 'array':
      return 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * Extract import dependencies from a TypeScript type string
 */
function extractImportsFromType(typeText: string, emberDataImportSource: string): string[] {
  const imports: string[] = [];

  // Look for specific types that need imports
  if (typeText.includes('AsyncHasMany') || typeText.includes('HasMany')) {
    imports.push(`type { AsyncHasMany, HasMany } from '${emberDataImportSource}'`);
  }

  return imports;
}

/**
 * Takes in the node representing the typescript type for a field and
 * extracts any relevant import dependencies and type declarations needed to support that type.
 *
 * For example:
 *
 * ```ts
 * import Model, { attr, hasMany, type AsyncHasMany } from '@ember-data/model';
 * import type Company from './company';
 * import type MainRoles from '../roles';
 *
 * export type ValidTitles = MainRoles | 'admin' | 'editor' | 'viewer';
 *
 * export default class User extends Model {
 *   @attr declare title: ValidTitles;
 *   @hasMany('company', { async: true }) declare companies: AsyncHasMany<Company>;
 * }
 * ```
 *
 * Will result in the following for the field 'companies'
 * and the SgNode representing `AsyncHasMany<Company>`:
 *
 * ```
 * {
 *   imports: [
 *     { imported: 'AsyncHasMany', source: '@ember-data/model', isType: true },
 *     { imported: 'Company', source: './company', isType: true }
 *   ],
 *   declarations: []
 * }
 * ```
 *
 * And for the field 'title' and the SgNode representing `ValidTitles`:
 *
 * ```
 * {
 *   imports: [
 *     { imported: 'MainRoles', source: '../roles', isType: true }
 *   ],
 *   declarations: [
 *     "export type ValidTitles = MainRoles | 'admin' | 'editor' | 'viewer';"
 *   ]
 * }
 * ```
 */
const PRIMITIVE_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'Date',
  'Promise',
  'null',
  'undefined',
  'unknown',
  'any',
  'void',
  'never',
  'object',
  'symbol',
  'bigint',
  'Array',
]);

function extractTypesForField(
  options: TransformOptions,
  typeNode: SgNode
): {
  imports: PackageImport[];
  declarations: string[];
  declarationNames: string[];
} {
  const imports: PackageImport[] = [];
  const declarations: string[] = [];
  const declarationNames: string[] = [];

  // Walk up to the file root
  const ancestors = typeNode.ancestors();
  const root = ancestors.length > 0 ? ancestors[ancestors.length - 1] : typeNode;

  // Build map: localName -> { imported, source } from all import statements
  const importMap = new Map<string, { imported: string; source: string }>();
  for (const stmt of root.findAll({ rule: { kind: 'import_statement' } })) {
    const sourceNode = stmt.field('source');
    if (!sourceNode) continue;
    const source = removeQuotes(sourceNode.text());

    for (const specifier of stmt.findAll({ rule: { kind: 'import_specifier' } })) {
      // Strip inline 'type' modifier (e.g. "type AsyncHasMany" -> "AsyncHasMany")
      let text = specifier.text().trim();
      if (text.startsWith('type ')) {
        text = text.slice(5).trim();
      }
      if (text.includes(' as ')) {
        const [imp, loc] = text.split(' as ').map((s) => s.trim());
        importMap.set(loc, { imported: imp, source });
      } else {
        importMap.set(text, { imported: text, source });
      }
    }

    // Default imports
    const importClause = stmt.children().find((c) => c.kind() === 'import_clause');
    if (importClause) {
      const firstChild = importClause.children()[0];
      if (firstChild?.kind() === 'identifier') {
        importMap.set(firstChild.text(), { imported: 'default', source });
      }
    }
  }

  // Build map: typeName -> SgNode for locally declared type aliases and interfaces
  const localTypeMap = new Map<string, SgNode>();
  for (const decl of root.findAll({
    rule: { any: [{ kind: 'type_alias_declaration' }, { kind: 'interface_declaration' }] },
  })) {
    const nameNode = decl.field('name');
    if (nameNode) localTypeMap.set(nameNode.text(), decl);
  }

  // Build map: valueName -> export statement text for locally declared const/let/var exports.
  // Needed to collect value declarations referenced via `typeof X` in type positions.
  const localValueMap = new Map<string, string>();
  for (const exportStmt of root.findAll({ rule: { kind: 'export_statement' } })) {
    const decl = exportStmt.find({
      rule: { any: [{ kind: 'lexical_declaration' }, { kind: 'variable_declaration' }] },
    });
    if (!decl) continue;
    for (const declarator of decl.findAll({ rule: { kind: 'variable_declarator' } })) {
      const nameNode = declarator.field('name');
      if (nameNode) localValueMap.set(nameNode.text(), exportStmt.text());
    }
  }

  const visited = new Set<string>();
  const addedImports = new Set<string>();
  const addedDeclarations = new Set<string>();

  const typeofIdentifierRule = { kind: 'identifier', inside: { kind: 'type_query', stopBy: 'end' } } as const;

  function processNode(node: SgNode): void {
    // Collect value imports from typeof expressions (e.g. typeof TimesheetableType.REGION)
    for (const valueId of node.findAll({ rule: typeofIdentifierRule })) {
      const valueName = valueId.text();
      if (!addedImports.has(valueName) && importMap.has(valueName)) {
        const { imported, source } = importMap.get(valueName)!;
        imports.push({ imported, local: valueName, source, isType: false });
        addedImports.add(valueName);
      }
    }

    for (const id of node.findAll({ rule: { kind: 'type_identifier' } })) {
      const name = id.text();
      if (PRIMITIVE_TYPES.has(name) || visited.has(name)) continue;
      visited.add(name);

      if (importMap.has(name)) {
        if (!addedImports.has(name)) {
          const { imported, source } = importMap.get(name)!;
          imports.push({ imported, local: name, source, isType: true });
          addedImports.add(name);
        }
      } else if (localTypeMap.has(name)) {
        if (!addedDeclarations.has(name)) {
          const decl = localTypeMap.get(name)!;

          // Collect local value declarations referenced via typeof before the
          // type declaration text (required for valid TS ordering).
          // Imported typeof references are handled by the top-level scan via recursion.
          for (const valueId of decl.findAll({ rule: typeofIdentifierRule })) {
            const valueName = valueId.text();
            if (!addedDeclarations.has(valueName) && localValueMap.has(valueName)) {
              declarations.push(localValueMap.get(valueName)!);
              addedDeclarations.add(valueName);
            }
          }

          const text = decl.text();
          const withExport = text.startsWith('export ') ? text : `export ${text}`;
          const withSemi = withExport.endsWith(';') ? withExport : `${withExport};`;
          declarations.push(withSemi);
          declarationNames.push(name);
          addedDeclarations.add(name);
          // Recurse to collect dependencies of this local type
          processNode(decl);
        }
      }
    }
  }

  processNode(typeNode);

  return { imports, declarations, declarationNames };
}

/**
 * Extract TypeScript type annotation from a property declaration
 */
export function extractTypeFromDeclaration(propertyNode: SgNode, options: TransformOptions): ExtractedType | null {
  try {
    // Look for type annotation in the property declaration
    const typeAnnotation = propertyNode.find({ rule: { kind: 'type_annotation' } });
    if (!typeAnnotation) {
      log.debug('No type annotation found for property');
      return null;
    }

    // Extract the type from the annotation
    const typeNode = typeAnnotation.children().find((child) => child.kind() !== ':');
    if (!typeNode) {
      log.debug('No type node found in type annotation');
      return null;
    }

    const typeText = typeNode.text();
    log.debug(`Extracted type: ${typeText}`);

    // Check for readonly modifier
    const readonly = propertyNode.text().includes('readonly ');

    // Check for optional modifier
    const optional = propertyNode.text().includes('?:');

    // Extract import dependencies from the type
    const { imports, declarations, declarationNames } = extractTypesForField(options, typeNode);

    return {
      type: typeText,
      readonly,
      optional,
      imports,
      declarations,
      declarationNames,
    };
  } catch (error) {
    log.debug(`Error extracting type: ${String(error)}`);
    return null;
  }
}

/**
 * Internal interface for parsed decorator options
 * Used to normalize options parsing from AST nodes
 */
interface ParsedDecoratorOptions {
  hasDefaultValue: boolean;
  allowNull: boolean;
  async: boolean;
}

/**
 * Parse decorator options from an AST node
 * Returns normalized options object for use in type extraction
 */
function parseDecoratorOptions(optionsNode: SgNode | undefined): ParsedDecoratorOptions {
  const defaults: ParsedDecoratorOptions = {
    hasDefaultValue: false,
    allowNull: true,
    async: false,
  };

  if (!optionsNode || optionsNode.kind() !== 'object') {
    return defaults;
  }

  try {
    const parsedOptions = parseObjectLiteralFromNode(optionsNode);
    return {
      hasDefaultValue: 'defaultValue' in parsedOptions,
      allowNull: parsedOptions.allowNull !== false && parsedOptions.allowNull !== 'false',
      async: parsedOptions.async === 'true' || parsedOptions.async === true,
    };
  } catch {
    return defaults;
  }
}

/**
 * Core implementation for extracting TypeScript types from EmberData decorators
 * This is the shared logic used by the type extraction function
 */
function extractTypeFromDecoratorCore(
  decoratorType: string,
  firstArg: string | undefined,
  parsedOptions: ParsedDecoratorOptions,
  options?: TransformOptions,
  fieldOptions?: Record<string, unknown>
): ExtractedType | null {
  switch (decoratorType) {
    case 'attr': {
      const attrType = firstArg ? removeQuotes(firstArg) : 'unknown';
      const { tsType, imports = [] } = getTypeScriptTypeForAttribute(
        attrType,
        parsedOptions.hasDefaultValue,
        parsedOptions.allowNull,
        options,
        fieldOptions
      );

      return {
        type: tsType,
        // @ts-expect-error
        imports: imports.length > 0 ? imports : undefined,
      };
    }

    case 'belongsTo': {
      const relatedType = firstArg ? removeQuotes(firstArg) : 'unknown';
      const modelName = toPascalCase(relatedType);

      const tsType = parsedOptions.async ? `Promise<${modelName} | null>` : `${modelName} | null`;

      return {
        type: tsType,
      };
    }

    case 'hasMany': {
      const relatedType = firstArg ? removeQuotes(firstArg) : 'unknown';
      const modelName = toPascalCase(relatedType);
      const imports: PackageImport[] = [];

      const emberDataSource = options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE;
      let tsType: string;

      if (parsedOptions.async) {
        tsType = `AsyncHasMany<${modelName}>`;
        imports.push({
          imported: 'AsyncHasMany',
          source: emberDataSource,
          isType: true,
        });
      } else {
        tsType = `HasMany<${modelName}>`;
        imports.push({
          imported: 'HasMany',
          source: emberDataSource,
          isType: true,
        });
      }

      return {
        type: tsType,
        imports: imports.length > 0 ? imports : undefined,
      };
    }

    default:
      return null;
  }
}

/**
 * Extract TypeScript type from an EmberData decorator based on the decorator type and AST nodes
 */
export function extractTypeFromDecorator(
  decoratorType: string,
  args: { text: string[]; nodes: SgNode[] },
  options?: TransformOptions
): ExtractedType | null {
  try {
    const firstArg = args.text[0];
    const optionsNode = args.nodes[1];
    const parsedOptions = parseDecoratorOptions(optionsNode);
    const fieldOptions =
      optionsNode && optionsNode.kind() === 'object' ? parseObjectLiteralFromNode(optionsNode) : undefined;

    return extractTypeFromDecoratorCore(decoratorType, firstArg, parsedOptions, options, fieldOptions);
  } catch (error) {
    log.debug(`Error extracting type from decorator: ${String(error)}`);
    return null;
  }
}

/**
 * Extract TypeScript type from a method declaration
 */
export function extractTypeFromMethod(methodNode: SgNode, options?: TransformOptions): ExtractedType | null {
  const emberDataImportSource = options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE;
  try {
    // Look for return type annotation
    const returnType = methodNode.find({ rule: { kind: 'type_annotation' } });
    if (returnType) {
      const typeNode = returnType.children().find((child) => child.kind() !== ':');
      if (typeNode) {
        const typeText = typeNode.text();
        const imports = extractImportsFromType(typeText, emberDataImportSource);
        return {
          type: typeText,
          // @ts-expect-error
          imports: imports.length > 0 ? imports : undefined,
        };
      }
    }

    // If no explicit return type, try to infer from method content
    const methodText = methodNode.text();

    // Check for getters
    if (methodText.includes('get ')) {
      // For getters, we could try to infer the return type, but for now return unknown
      return { type: 'unknown' };
    }

    // Check for async methods
    if (methodText.includes('async ')) {
      return { type: 'Promise<unknown>' };
    }

    // For regular methods without explicit return type
    return { type: 'unknown' };
  } catch (error) {
    log.debug(`Error extracting type from method: ${String(error)}`);
    return null;
  }
}

/**
 * Extract type information from an interface declaration
 */
export function extractTypesFromInterface(
  interfaceNode: SgNode,
  options?: TransformOptions
): Map<string, ExtractedType> {
  const typeMap = new Map<string, ExtractedType>();
  const emberDataImportSource = options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE;

  // Find the interface body
  const body = interfaceNode.find({ rule: { kind: 'object_type' } });
  if (!body) {
    log.debug('No interface body found');
    return typeMap;
  }

  // Find all property signatures in the interface
  const properties = body.findAll({ rule: { kind: 'property_signature' } });

  for (const property of properties) {
    const nameNode = property.field('name');
    const typeAnnotation = property.find({ rule: { kind: 'type_annotation' } });

    if (!nameNode || !typeAnnotation) continue;

    const propertyName = nameNode.text();
    const typeNode = typeAnnotation.children().find((child) => child.kind() !== ':');

    if (!typeNode) continue;

    const typeText = typeNode.text();
    const readonly = property.text().includes('readonly ');
    const optional = property.text().includes('?:');

    typeMap.set(propertyName, {
      type: typeText,
      readonly,
      optional,
      // @ts-expect-error
      imports: extractImportsFromType(typeText, emberDataImportSource),
    });

    log.debug(`Extracted type for ${propertyName}: ${typeText}`);
  }

  return typeMap;
}
