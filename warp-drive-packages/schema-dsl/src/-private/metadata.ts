/**
 * @module
 * @internal
 */

import type { GenericField, IdentityField } from '@warp-drive/core/types/schema/fields';

export interface ResourceMetadata {
  type?: string;
  legacy?: boolean;
  identityField?: string;
}

export interface FieldMetadata {
  name: string;
  kind: 'field' | '@id';
  type?: string;
  sourceKey?: string;
}

const ResourceMetaStore = new WeakMap<object, ResourceMetadata>();
const FieldMetaStore = new WeakMap<object, Map<string, FieldMetadata>>();

export function getResourceMeta(target: object): ResourceMetadata | undefined {
  return ResourceMetaStore.get(target);
}

export function setResourceMeta(target: object, meta: ResourceMetadata): void {
  ResourceMetaStore.set(target, meta);
}

export function hasResourceMeta(target: object): boolean {
  return ResourceMetaStore.has(target);
}

export function getFieldMeta(target: object): Map<string, FieldMetadata> | undefined {
  return FieldMetaStore.get(target);
}

export function getOrCreateFieldMeta(target: object): Map<string, FieldMetadata> {
  let fields = FieldMetaStore.get(target);
  if (!fields) {
    fields = new Map();
    FieldMetaStore.set(target, fields);
  }
  return fields;
}

export function addFieldMeta(target: object, propertyKey: string, meta: FieldMetadata): void {
  const fields = getOrCreateFieldMeta(target);
  fields.set(propertyKey, meta);
}

export type CompiledField = GenericField;
export type CompiledIdentity = IdentityField;
