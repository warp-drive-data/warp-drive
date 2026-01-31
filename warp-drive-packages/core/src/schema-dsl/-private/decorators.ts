/**
 * Decorators for the Schema DSL.
 *
 * These decorators mark classes and properties with metadata
 * that is later compiled into canonical ResourceSchema objects.
 *
 * @module
 * @internal
 */

import { dasherize } from '../../utils/string.ts';
import { addFieldMeta, type FieldMetadata, type ResourceMetadata, setResourceMeta } from './metadata.ts';

export interface ResourceOptions {
  /**
   * Enable legacy mode for compatibility with @warp-drive/legacy/model.
   */
  legacy?: boolean;

  /**
   * Custom identity field name.
   * Defaults to 'id'.
   */
  identityField?: string;
}

/**
 * Marks a class as a Resource schema.
 *
 * The resource type name is derived from the class name by default:
 * - `User` → `'user'`
 * - `UserProfile` → `'user-profile'`
 *
 * @example
 * ```ts
 * @Resource
 * class User {
 *   @field declare firstName: string;
 * }
 * ```
 *
 * @example
 * ```ts
 * @Resource('custom-user')
 * class User {
 *   @field declare name: string;
 * }
 * ```
 *
 * @example
 * ```ts
 * @Resource({ legacy: true })
 * class Post {
 *   @field declare title: string;
 * }
 * ```
 */
export function Resource(target: new (...args: unknown[]) => object): void;
export function Resource(type: string): (target: new (...args: unknown[]) => object) => void;
export function Resource(options: ResourceOptions): (target: new (...args: unknown[]) => object) => void;
export function Resource(type: string, options: ResourceOptions): (target: new (...args: unknown[]) => object) => void;
export function Resource(
  targetOrTypeOrOptions?: (new (...args: unknown[]) => object) | string | ResourceOptions,
  maybeOptions?: ResourceOptions
): void | ((target: new (...args: unknown[]) => object) => void) {
  // Case 1: @Resource (no arguments, direct application)
  if (typeof targetOrTypeOrOptions === 'function') {
    const target = targetOrTypeOrOptions;
    setResourceMeta(target, {});
    return;
  }

  // Case 2: @Resource(type), @Resource(options), or @Resource(type, options)
  return function (target: new (...args: unknown[]) => object): void {
    let meta: ResourceMetadata;

    if (typeof targetOrTypeOrOptions === 'string') {
      // @Resource(type) or @Resource(type, options)
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
  /**
   * Transform name (e.g., 'date-time', 'number').
   */
  type?: string;

  /**
   * Alternative name in the cache if different from property name.
   */
  sourceKey?: string;
}

/**
 * Marks a property as a field in the resource schema.
 *
 * Fields represent primitive values (strings, numbers, booleans, dates).
 *
 * @example
 * ```ts
 * @Resource
 * class User {
 *   @field declare firstName: string;
 *   @field declare age: number;
 *
 *   @field({ type: 'date-time' })
 *   declare createdAt: Date;
 *
 *   @field({ sourceKey: 'email_address' })
 *   declare email: string;
 * }
 * ```
 */
export function field(target: object, propertyKey: string): void;
export function field(options: FieldOptions): (target: object, propertyKey: string) => void;
export function field(
  targetOrOptions?: object | FieldOptions,
  propertyKey?: string
): void | ((target: object, propertyKey: string) => void) {
  // Case 1: @field (no arguments, direct application)
  if (targetOrOptions && typeof targetOrOptions === 'object' && propertyKey !== undefined) {
    const target = targetOrOptions;
    const meta: FieldMetadata = {
      name: propertyKey,
      kind: 'field',
    };
    // Store on the constructor (prototype.constructor)
    addFieldMeta(target.constructor, propertyKey, meta);
    return;
  }

  // Case 2: @field(options)
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
 *
 * Typically not needed as WarpDrive provides a default identity field.
 * Use this when your resource uses a different field name for identity.
 *
 * @example
 * ```ts
 * @Resource
 * class User {
 *   @id declare uuid: string;
 *   @field declare name: string;
 * }
 * ```
 */
export function id(target: object, propertyKey: string): void;
export function id(options: IdOptions): (target: object, propertyKey: string) => void;
export function id(
  targetOrOptions?: object | IdOptions,
  propertyKey?: string
): void | ((target: object, propertyKey: string) => void) {
  // Case 1: @id (no arguments, direct application)
  if (targetOrOptions && typeof targetOrOptions === 'object' && propertyKey !== undefined) {
    const target = targetOrOptions;
    const meta: FieldMetadata = {
      name: propertyKey,
      kind: '@id',
    };
    addFieldMeta(target.constructor, propertyKey, meta);
    return;
  }

  // Case 2: @id(options)
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

/**
 * Derives a resource type name from a class name.
 *
 * Examples:
 * - `User` → `'user'`
 * - `UserProfile` → `'user-profile'`
 * - `APIKey` → `'api-key'`
 */
export function deriveTypeName(className: string): string {
  return dasherize(className);
}
