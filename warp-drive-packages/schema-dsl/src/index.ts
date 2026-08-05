/**
 * Decorators for authoring WarpDrive resource schemas.
 *
 * Schema files are compiled at build time by the Vite plugin.
 * The decorator functions themselves are no-ops at runtime.
 *
 * @module @warp-drive/schema-dsl
 */

export interface ResourceOptions {
  legacy?: boolean;
  identityField?: string;
}

export interface FieldOptions {
  type?: string;
  sourceKey?: string;
}

export interface IdOptions {
  sourceKey?: string;
}

type AnyConstructor = abstract new (...args: unknown[]) => unknown;

/**
 * Marks a class as a resource schema.
 *
 * @public
 */
export function Resource(target: AnyConstructor): void;
export function Resource(type: string, options?: ResourceOptions): (target: AnyConstructor) => void;
export function Resource(options: ResourceOptions): (target: AnyConstructor) => void;
export function Resource(
  _targetOrTypeOrOptions?: unknown,
  _maybeOptions?: unknown
): void | ((target: AnyConstructor) => void) {}

/**
 * Marks a property as a field on the resource schema.
 *
 * @public
 */
export function field(target: object, key: string): void;
export function field(options: FieldOptions): (target: object, key: string) => void;
export function field(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Marks a property as the identity field for the resource.
 *
 * @public
 */
export function id(target: object, key: string): void;
export function id(options: IdOptions): (target: object, key: string) => void;
export function id(_targetOrOptions?: unknown, _propertyKey?: string): void | ((target: object, key: string) => void) {}
