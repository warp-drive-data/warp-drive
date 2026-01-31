/**
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

const DefaultIdentityField: IdentityField = {
  kind: '@id',
  name: 'id',
};

const TypeField: DerivedField = {
  kind: 'derived',
  name: '$type',
  type: '@identity',
  options: { key: 'type' },
};

const ConstructorField: DerivedField = {
  kind: 'derived',
  name: 'constructor',
  type: '@constructor',
};

export interface CompileOptions {
  includeDefaults?: boolean;
}

/**
 * Compiles a DSL-decorated class into a canonical ResourceSchema.
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

  const type = resourceMeta.type ?? deriveTypeName(ResourceClass.name);
  const isLegacy = resourceMeta.legacy === true;

  let identity: IdentityField;
  let customIdentityField: FieldMetadata | undefined;

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

  const fields: (GenericField | DerivedField)[] = [];
  const includeDefaults = options?.includeDefaults ?? !isLegacy;

  if (includeDefaults) {
    fields.push(TypeField);
  }

  if (fieldMeta) {
    for (const [, meta] of fieldMeta) {
      if (meta.kind === '@id') {
        continue;
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

  if (includeDefaults) {
    fields.push(ConstructorField);
  }

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
 */
export function compileResourceSchemas(
  classes: Array<new (...args: unknown[]) => object>,
  options?: CompileOptions
): ResourceSchema[] {
  return classes.map((cls) => compileResourceSchema(cls, options));
}
