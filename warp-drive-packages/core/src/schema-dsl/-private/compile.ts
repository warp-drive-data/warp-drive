/**
 * Schema compilation for the DSL.
 *
 * This module transforms DSL metadata (collected by decorators)
 * into canonical ResourceSchema objects that can be registered
 * with the SchemaService.
 *
 * @module
 * @internal
 */

import type {
  DerivedField,
  GenericField,
  IdentityField,
  LegacyResourceSchema,
  PolarisResourceSchema,
  ResourceSchema,
} from '../../types/schema/fields.ts';
import { deriveTypeName } from './decorators.ts';
import { getFieldMeta, getResourceMeta, hasResourceMeta, type FieldMetadata } from './metadata.ts';

// =========================================
// Default Fields (aligned with withDefaults)
// =========================================

/**
 * Default identity field.
 */
const DefaultIdentityField: IdentityField = {
  kind: '@id',
  name: 'id',
};

/**
 * Derived field for $type (resource type from identity).
 */
const TypeField: DerivedField = {
  kind: 'derived',
  name: '$type',
  type: '@identity',
  options: { key: 'type' },
};

/**
 * Derived field for constructor (provides constructor.name).
 */
const ConstructorField: DerivedField = {
  kind: 'derived',
  name: 'constructor',
  type: '@constructor',
};

// =========================================
// Compilation
// =========================================

export interface CompileOptions {
  /**
   * Whether to include the default $type and constructor derived fields.
   * Defaults to true for Polaris mode, false for legacy mode.
   */
  includeDefaults?: boolean;
}

/**
 * Compiles a single DSL-decorated class into a canonical ResourceSchema.
 *
 * @param ResourceClass - A class decorated with @Resource
 * @param options - Compilation options
 * @returns The compiled ResourceSchema
 * @throws If the class is not decorated with @Resource
 *
 * @example
 * ```ts
 * @Resource
 * class User {
 *   @field declare firstName: string;
 *   @field declare lastName: string;
 * }
 *
 * const schema = compileResourceSchema(User);
 * // Result:
 * // {
 * //   type: 'user',
 * //   identity: { kind: '@id', name: 'id' },
 * //   fields: [
 * //     { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
 * //     { kind: 'field', name: 'firstName' },
 * //     { kind: 'field', name: 'lastName' },
 * //     { kind: 'derived', name: 'constructor', type: '@constructor' }
 * //   ]
 * // }
 * ```
 */
export function compileResourceSchema(
  ResourceClass: new (...args: unknown[]) => object,
  options?: CompileOptions
): ResourceSchema {
  if (!hasResourceMeta(ResourceClass)) {
    throw new Error(
      `Cannot compile schema for '${ResourceClass.name}': class is not decorated with @Resource. ` +
        `Add @Resource decorator to the class.`
    );
  }

  const resourceMeta = getResourceMeta(ResourceClass)!;
  const fieldMeta = getFieldMeta(ResourceClass);

  // Derive type name from class name if not explicitly provided
  const type = resourceMeta.type ?? deriveTypeName(ResourceClass.name);

  // Determine if this is legacy mode
  const isLegacy = resourceMeta.legacy === true;

  // Build identity field
  let identity: IdentityField;
  let customIdentityField: FieldMetadata | undefined;

  // Check if user defined an @id field
  if (fieldMeta) {
    for (const [, meta] of fieldMeta) {
      if (meta.kind === '@id') {
        customIdentityField = meta;
        break;
      }
    }
  }

  if (customIdentityField) {
    identity = {
      kind: '@id',
      name: customIdentityField.name,
      ...(customIdentityField.sourceKey ? { sourceKey: customIdentityField.sourceKey } : {}),
    };
  } else if (resourceMeta.identityField) {
    identity = {
      kind: '@id',
      name: resourceMeta.identityField,
    };
  } else {
    identity = DefaultIdentityField;
  }

  // Build fields array
  const fields: (GenericField | DerivedField)[] = [];

  // Determine whether to include default derived fields
  const includeDefaults = options?.includeDefaults ?? !isLegacy;

  // Add $type derived field at the beginning (for Polaris mode)
  if (includeDefaults) {
    fields.push(TypeField);
  }

  // Add user-defined fields (skip @id fields, they go in identity)
  if (fieldMeta) {
    for (const [, meta] of fieldMeta) {
      if (meta.kind === '@id') {
        continue; // Identity is handled separately
      }

      const field: GenericField = {
        kind: 'field',
        name: meta.name,
      };

      if (meta.type) {
        field.type = meta.type;
      }

      if (meta.sourceKey) {
        field.sourceKey = meta.sourceKey;
      }

      fields.push(field);
    }
  }

  // Add constructor derived field at the end (for Polaris mode)
  if (includeDefaults) {
    fields.push(ConstructorField);
  }

  // Build the schema
  if (isLegacy) {
    const schema: LegacyResourceSchema = {
      legacy: true,
      type,
      identity,
      fields,
    };
    return schema;
  }

  const schema: PolarisResourceSchema = {
    type,
    identity,
    fields,
  };

  return schema;
}

/**
 * Compiles multiple DSL-decorated classes into ResourceSchema objects.
 *
 * @param classes - Array of classes decorated with @Resource
 * @param options - Compilation options (applied to all)
 * @returns Array of compiled ResourceSchema objects
 *
 * @example
 * ```ts
 * @Resource
 * class User {
 *   @field declare name: string;
 * }
 *
 * @Resource
 * class Post {
 *   @field declare title: string;
 * }
 *
 * const schemas = compileResourceSchemas([User, Post]);
 * store.schema.registerResources(schemas);
 * ```
 */
export function compileResourceSchemas(
  classes: Array<new (...args: unknown[]) => object>,
  options?: CompileOptions
): ResourceSchema[] {
  return classes.map((cls) => compileResourceSchema(cls, options));
}
