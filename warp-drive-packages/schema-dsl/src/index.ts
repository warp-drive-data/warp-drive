/**
 * Decorators for authoring WarpDrive resource schemas.
 *
 * Schema files are compiled at build time by the Vite plugin.
 * The decorator functions themselves are no-ops at runtime.
 *
 * @module @warp-drive/schema-dsl
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type AnyConstructor = abstract new (...args: unknown[]) => unknown;
type PrimitiveValue = string | number | boolean | null;

// ---------------------------------------------------------------------------
// @Resource
// ---------------------------------------------------------------------------

export interface ResourceOptions {
  legacy?: boolean;
  identityField?: string;
}

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

// ---------------------------------------------------------------------------
// @Object
// ---------------------------------------------------------------------------

export interface ObjectSchemaOptions {
  hash?: boolean;
}

/**
 * Marks a class as an object schema (non-resource, no unique identity).
 *
 * @public
 */
export function ObjectSchema(target: AnyConstructor): void;
export function ObjectSchema(type: string, options?: ObjectSchemaOptions): (target: AnyConstructor) => void;
export function ObjectSchema(options: ObjectSchemaOptions): (target: AnyConstructor) => void;
export function ObjectSchema(
  _targetOrTypeOrOptions?: unknown,
  _maybeOptions?: unknown
): void | ((target: AnyConstructor) => void) {}

// ---------------------------------------------------------------------------
// @Trait
// ---------------------------------------------------------------------------

export interface TraitOptions {
  mode?: 'legacy' | 'polaris';
}

/**
 * Marks a class as a trait schema (reusable field set).
 *
 * @public
 */
export function Trait(target: AnyConstructor): void;
export function Trait(name: string, options?: TraitOptions): (target: AnyConstructor) => void;
export function Trait(options: TraitOptions): (target: AnyConstructor) => void;
export function Trait(
  _targetOrNameOrOptions?: unknown,
  _maybeOptions?: unknown
): void | ((target: AnyConstructor) => void) {}

// ---------------------------------------------------------------------------
// @trait (composition)
// ---------------------------------------------------------------------------

/**
 * Composes traits into a Resource, Object, or Trait class.
 *
 * @public
 */
export function trait(..._traits: AnyConstructor[]): (target: AnyConstructor) => void {
  return function (_target: AnyConstructor): void {};
}

// ---------------------------------------------------------------------------
// @field
// ---------------------------------------------------------------------------

export interface FieldOptions {
  type?: string;
  sourceKey?: string;
}

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

// ---------------------------------------------------------------------------
// @id
// ---------------------------------------------------------------------------

export interface IdOptions {
  sourceKey?: string;
}

/**
 * Marks a property as the identity field for the resource.
 *
 * @public
 */
export function id(target: object, key: string): void;
export function id(options: IdOptions): (target: object, key: string) => void;
export function id(_targetOrOptions?: unknown, _propertyKey?: string): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @local
// ---------------------------------------------------------------------------

export interface LocalOptions {
  defaultValue?: PrimitiveValue;
}

/**
 * Marks a property as a local field (not stored in cache, not sent to server).
 *
 * @public
 */
export function local(target: object, key: string): void;
export function local(options: LocalOptions): (target: object, key: string) => void;
export function local(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @hash
// ---------------------------------------------------------------------------

export interface HashOptions {
  type: string;
}

/**
 * Marks a property as the hash identity field for an object schema.
 *
 * @public
 */
export function hash(options: HashOptions): (target: object, key: string) => void;
export function hash(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @object
// ---------------------------------------------------------------------------

export interface ObjectFieldOptions {
  sourceKey?: string;
  type?: string;
}

/**
 * Marks a property as an unstructured object field.
 *
 * @public
 */
export function object(target: object, key: string): void;
export function object(options: ObjectFieldOptions): (target: object, key: string) => void;
export function object(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @array
// ---------------------------------------------------------------------------

export interface ArrayFieldOptions {
  sourceKey?: string;
  type?: string;
}

/**
 * Marks a property as an array field of primitive values.
 *
 * @public
 */
export function array(target: object, key: string): void;
export function array(options: ArrayFieldOptions): (target: object, key: string) => void;
export function array(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @derived
// ---------------------------------------------------------------------------

export interface DerivedOptions {
  type: string;
  options?: Record<string, unknown>;
}

/**
 * Marks a property as a derived (computed, read-only) field.
 *
 * @public
 */
export function derived(options: DerivedOptions): (target: object, key: string) => void;
export function derived(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @alias
// ---------------------------------------------------------------------------

export interface AliasOptions {
  kind: string;
  name: string;
  type?: string;
  sourceKey?: string;
}

/**
 * Marks a property as an alias to another field in the cache.
 *
 * @public
 */
export function alias(options: AliasOptions): (target: object, key: string) => void;
export function alias(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @attribute (legacy)
// ---------------------------------------------------------------------------

export interface AttributeOptions {
  sourceKey?: string;
  type?: string;
}

/**
 * Marks a property as a legacy attribute field.
 *
 * @public
 */
export function attribute(target: object, key: string): void;
export function attribute(options: AttributeOptions): (target: object, key: string) => void;
export function attribute(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @belongsTo (legacy)
// ---------------------------------------------------------------------------

export interface BelongsToOptions {
  type: string;
  inverse: string | null;
  async?: boolean;
  polymorphic?: boolean;
  as?: string;
  sourceKey?: string;
}

/**
 * Marks a property as a legacy belongsTo relationship.
 *
 * @public
 */
export function belongsTo(options: BelongsToOptions): (target: object, key: string) => void;
export function belongsTo(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @hasMany (legacy)
// ---------------------------------------------------------------------------

export interface HasManyOptions {
  type: string;
  inverse: string | null;
  async?: boolean;
  polymorphic?: boolean;
  as?: string;
  sourceKey?: string;
}

/**
 * Marks a property as a legacy hasMany relationship.
 *
 * @public
 */
export function hasMany(options: HasManyOptions): (target: object, key: string) => void;
export function hasMany(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// Modifier decorators (type-generation only, no-op)
// ---------------------------------------------------------------------------

/**
 * Marks a field as readonly (cannot be created or edited).
 *
 * @public
 */
export function readonly(target: object, key: string): void;
export function readonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Marks a field as optional during creation.
 *
 * @public
 */
export function optional(target: object, key: string): void;
export function optional(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Marks a field as create-only (cannot be edited after creation).
 *
 * @public
 */
export function createonly(target: object, key: string): void;
export function createonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Marks a field as edit-only (cannot be set during creation).
 *
 * @public
 */
export function editonly(target: object, key: string): void;
export function editonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
