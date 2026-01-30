/**
 * Internal metadata storage for the Schema DSL.
 *
 * This module provides the infrastructure for decorators to record
 * metadata about classes and properties. The metadata is later read
 * by the compile step to produce canonical ResourceSchema objects.
 *
 * @module
 * @internal
 */

import type { GenericField, IdentityField } from '../../types/schema/fields.ts';

// =========================================
// Types
// =========================================

export interface ResourceMetadata {
  /**
   * The resource type name.
   * If not provided, derived from the class name.
   */
  type?: string;

  /**
   * Whether this resource uses legacy mode.
   */
  legacy?: boolean;

  /**
   * Custom identity field name.
   * Defaults to 'id'.
   */
  identityField?: string;
}

export interface FieldMetadata {
  /**
   * The property name on the class.
   */
  name: string;

  /**
   * The field kind.
   */
  kind: 'field' | '@id';

  /**
   * Transform name for the field.
   */
  type?: string;

  /**
   * Alternative name in the cache if different from property name.
   */
  sourceKey?: string;
}

// =========================================
// Metadata Storage
// =========================================

/**
 * Stores resource-level metadata keyed by constructor function.
 */
const ResourceMetaStore = new WeakMap<object, ResourceMetadata>();

/**
 * Stores field metadata keyed by constructor function.
 * Each constructor maps to a Map of propertyKey -> FieldMetadata.
 */
const FieldMetaStore = new WeakMap<object, Map<string, FieldMetadata>>();

// =========================================
// Metadata Accessors
// =========================================

/**
 * Get resource metadata for a class.
 */
export function getResourceMeta(target: object): ResourceMetadata | undefined {
  return ResourceMetaStore.get(target);
}

/**
 * Set resource metadata for a class.
 */
export function setResourceMeta(target: object, meta: ResourceMetadata): void {
  ResourceMetaStore.set(target, meta);
}

/**
 * Check if a class has resource metadata (i.e., was decorated with @Resource).
 */
export function hasResourceMeta(target: object): boolean {
  return ResourceMetaStore.has(target);
}

/**
 * Get field metadata map for a class.
 */
export function getFieldMeta(target: object): Map<string, FieldMetadata> | undefined {
  return FieldMetaStore.get(target);
}

/**
 * Get or create field metadata map for a class.
 */
export function getOrCreateFieldMeta(target: object): Map<string, FieldMetadata> {
  let fields = FieldMetaStore.get(target);
  if (!fields) {
    fields = new Map();
    FieldMetaStore.set(target, fields);
  }
  return fields;
}

/**
 * Add a field to the metadata store.
 */
export function addFieldMeta(target: object, propertyKey: string, meta: FieldMetadata): void {
  const fields = getOrCreateFieldMeta(target);
  fields.set(propertyKey, meta);
}

// =========================================
// Compiled Schema Types
// =========================================

/**
 * The internal representation of a compiled field,
 * matching the canonical GenericField shape.
 */
export type CompiledField = GenericField;

/**
 * The internal representation of a compiled identity field.
 */
export type CompiledIdentity = IdentityField;
