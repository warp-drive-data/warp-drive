/**
 * @module
 * @internal
 */

import { dasherize } from '@warp-drive/utilities/string';

import { addFieldMeta, type FieldMetadata, type ResourceMetadata, setResourceMeta } from './metadata.ts';

export interface ResourceOptions {
  legacy?: boolean;
  identityField?: string;
}

/**
 * Marks a class as a Resource schema.
 *
 * Type name is derived from class name: `User` → `'user'`, `UserProfile` → `'user-profile'`
 */
export function Resource(target: new (...args: unknown[]) => object): void;
export function Resource(type: string): (target: new (...args: unknown[]) => object) => void;
export function Resource(options: ResourceOptions): (target: new (...args: unknown[]) => object) => void;
export function Resource(type: string, options: ResourceOptions): (target: new (...args: unknown[]) => object) => void;
export function Resource(
  targetOrTypeOrOptions?: (new (...args: unknown[]) => object) | string | ResourceOptions,
  maybeOptions?: ResourceOptions
): void | ((target: new (...args: unknown[]) => object) => void) {
  if (typeof targetOrTypeOrOptions === 'function') {
    const target = targetOrTypeOrOptions;
    setResourceMeta(target, {});
    return;
  }

  return function (target: new (...args: unknown[]) => object): void {
    let meta: ResourceMetadata;

    if (typeof targetOrTypeOrOptions === 'string') {
      meta = {
        type: targetOrTypeOrOptions,
        ...(maybeOptions || {}),
      };
    } else {
      meta = targetOrTypeOrOptions || {};
    }

    setResourceMeta(target, meta);
  };
}

export interface FieldOptions {
  type?: string;
  sourceKey?: string;
}

/**
 * Marks a property as a field in the resource schema.
 */
export function field(target: object, propertyKey: string): void;
export function field(options: FieldOptions): (target: object, propertyKey: string) => void;
export function field(
  targetOrOptions?: object | FieldOptions,
  propertyKey?: string
): void | ((target: object, propertyKey: string) => void) {
  if (targetOrOptions && typeof targetOrOptions === 'object' && propertyKey !== undefined) {
    const target = targetOrOptions;
    const meta: FieldMetadata = {
      name: propertyKey,
      kind: 'field',
    };
    addFieldMeta(target.constructor, propertyKey, meta);
    return;
  }

  const options = (targetOrOptions as FieldOptions) || {};
  return function (target: object, key: string): void {
    const meta: FieldMetadata = {
      name: key,
      kind: 'field',
      type: options.type,
      sourceKey: options.sourceKey,
    };
    addFieldMeta(target.constructor, key, meta);
  };
}

export interface IdOptions {
  sourceKey?: string;
}

/**
 * Marks a property as the identity field for the resource.
 */
export function id(target: object, propertyKey: string): void;
export function id(options: IdOptions): (target: object, propertyKey: string) => void;
export function id(
  targetOrOptions?: object | IdOptions,
  propertyKey?: string
): void | ((target: object, propertyKey: string) => void) {
  if (targetOrOptions && typeof targetOrOptions === 'object' && propertyKey !== undefined) {
    const target = targetOrOptions;
    const meta: FieldMetadata = {
      name: propertyKey,
      kind: '@id',
    };
    addFieldMeta(target.constructor, propertyKey, meta);
    return;
  }

  const options = (targetOrOptions as IdOptions) || {};
  return function (target: object, key: string): void {
    const meta: FieldMetadata = {
      name: key,
      kind: '@id',
      sourceKey: options.sourceKey,
    };
    addFieldMeta(target.constructor, key, meta);
  };
}

export function deriveTypeName(className: string): string {
  return dasherize(className);
}
