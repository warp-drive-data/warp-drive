import type { SgNode } from '@ast-grep/napi';

import type { TransformOptions } from '../config.js';
import { parseObjectLiteralFromNode } from './ast-helpers.js';
import { DEFAULT_EMBER_DATA_SOURCE, DEFAULT_MIXIN_SOURCE } from './import-utils.js';
import { debugLog } from './logging.js';
import { removeQuotes, toPascalCase } from './path-utils.js';

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
  imports?: string[];
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
    const allowedValues = fieldOptions.allowedValues as string;

    // Check if this is a complex expression (contains function calls, operators, etc.)
    // If so, fall back to a simple string type instead of trying to generate complex types
    if (!/^[a-z][0-9]\.$/.test(allowedValues)) {
      // For complex expressions, just use string type
      const tsType = allowNull ? 'string | null' : 'string';
      return { tsType };
    }

    // For simple enum types, we need to generate a union type
    // The allowedValues should be the enum name (e.g., "FrameworkUpdateStatus")
    // We'll generate a union type like: (typeof FrameworkUpdateStatus)[keyof typeof FrameworkUpdateStatus]
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
    let tsType: string;
    if (attrType === 'boolean') {
      // Special handling for boolean nullability
      tsType = allowNull ? 'boolean | null' : 'boolean';
    } else {
      tsType = hasDefaultValue || !allowNull ? builtInMapping : `${builtInMapping} | null`;
    }
    return { tsType };
  }

  // Fallback to unknown for unsupported types
  const tsType = hasDefaultValue || !allowNull ? 'unknown' : 'unknown | null';
  return { tsType };
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
 * Extract TypeScript type annotation from a property declaration
 */
export function extractTypeFromDeclaration(propertyNode: SgNode, options?: TransformOptions): ExtractedType | null {
  const emberDataImportSource = options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE;
  try {
    // Look for type annotation in the property declaration
    const typeAnnotation = propertyNode.find({ rule: { kind: 'type_annotation' } });
    if (!typeAnnotation) {
      debugLog(options, 'No type annotation found for property');
      return null;
    }

    // Extract the type from the annotation
    const typeNode = typeAnnotation.children().find((child) => child.kind() !== ':');
    if (!typeNode) {
      debugLog(options, 'No type node found in type annotation');
      return null;
    }

    const typeText = typeNode.text();
    debugLog(options, `Extracted type: ${typeText}`);

    // Check for readonly modifier
    const readonly = propertyNode.text().includes('readonly ');

    // Check for optional modifier
    const optional = propertyNode.text().includes('?:');

    // Extract import dependencies from the type
    const imports = extractImportsFromType(typeText, emberDataImportSource);

    return {
      type: typeText,
      readonly,
      optional,
      imports: imports.length > 0 ? imports : undefined,
    };
  } catch (error) {
    debugLog(options, `Error extracting type: ${String(error)}`);
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
      allowNull: parsedOptions.allowNull !== 'false',
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
  options?: TransformOptions
): ExtractedType | null {
  switch (decoratorType) {
    case 'attr': {
      const attrType = firstArg ? removeQuotes(firstArg) : 'unknown';
      const { tsType, imports = [] } = getTypeScriptTypeForAttribute(
        attrType,
        parsedOptions.hasDefaultValue,
        parsedOptions.allowNull,
        options
      );

      return {
        type: tsType,
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
      const imports: string[] = [];

      const emberDataSource = options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE;
      let tsType: string;

      if (parsedOptions.async) {
        tsType = `AsyncHasMany<${modelName}>`;
        imports.push(`type { AsyncHasMany } from '${emberDataSource}'`);
      } else {
        tsType = `HasMany<${modelName}>`;
        imports.push(`type { HasMany } from '${emberDataSource}'`);
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

    return extractTypeFromDecoratorCore(decoratorType, firstArg, parsedOptions, options);
  } catch (error) {
    debugLog(options, `Error extracting type from decorator: ${String(error)}`);
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
    debugLog(options, `Error extracting type from method: ${String(error)}`);
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
    debugLog(options, 'No interface body found');
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
      imports: extractImportsFromType(typeText, emberDataImportSource),
    });

    debugLog(options, `Extracted type for ${propertyName}: ${typeText}`);
  }

  return typeMap;
}
