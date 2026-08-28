/**
 * @module
 * @mergeModuleWith <project>
 */

/* eslint-disable @typescript-eslint/no-unused-vars -- imported only for {@link} cross-references in doc comments */
import type { Derivation, HashFn, Transformation } from '@warp-drive/core/types/schema/concepts';
import type {
  ArrayField,
  DerivedField,
  GenericField,
  HashField,
  IdentityField,
  LegacyAliasField,
  LegacyAttributeField,
  LegacyBelongsToField,
  LegacyHasManyField,
  LegacyResourceSchema,
  LegacyTrait,
  LocalField,
  ObjectAliasField,
  ObjectField,
  ObjectSchema as ObjectSchemaRecord,
  PolarisAliasField,
  PolarisResourceSchema,
  PolarisTrait,
  Trait as TraitRecord,
} from '@warp-drive/core/types/schema/fields';
/* eslint-enable @typescript-eslint/no-unused-vars */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type AnyConstructor = abstract new (...args: unknown[]) => unknown;
type PrimitiveValue = string | number | boolean | null;

// ---------------------------------------------------------------------------
// @Resource
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link Resource} decorator.
 *
 * @public
 */
export interface ResourceOptions {
  /**
   * Compiles the class to a {@link LegacyResourceSchema} for use with
   * `@warp-drive/legacy/model` instead of a {@link PolarisResourceSchema}.
   *
   * Legacy resources omit the `$type` and `constructor` {@link DerivedField}s
   * that {@link Resource} otherwise adds automatically.
   *
   * @public
   */
  legacy?: boolean;

  /**
   * The name of the property that serves as this resource's primary key,
   * used only when no property on the class is decorated with {@link id}.
   *
   * Compiles to `identity: { kind: '@id', name: identityField }`. When
   * omitted (and no {@link id} is present), the identity defaults to
   * `{ kind: '@id', name: 'id' }`.
   *
   * @public
   */
  identityField?: string;
}

/**
 * Marks a class as a resource schema &mdash; a primary resource with its own
 * unique {@link IdentityField | identity} &mdash; compiling it to a
 * {@link PolarisResourceSchema}, or a {@link LegacyResourceSchema} when
 * {@link ResourceOptions.legacy} is set.
 *
 * The resource's `type` is derived from the class name (dasherized, e.g.
 * `UserProfile` compiles to `'user-profile'`) unless a `type` string is
 * passed explicitly. Its identity defaults to `{ kind: '@id', name: 'id' }`
 * unless a property is decorated with {@link id}, or
 * {@link ResourceOptions.identityField} names a different property.
 *
 * Each decorated property on the class contributes one entry to the
 * compiled `fields` array, in declaration order. Unless
 * {@link ResourceOptions.legacy} is set, a `$type` and a `constructor`
 * {@link DerivedField} are appended automatically: the first before any
 * declared fields, the second after.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare firstName: string;
 *   @field declare lastName: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "type": "user",
 *   "identity": { "kind": "@id", "name": "id" },
 *   "fields": [
 *     { "kind": "derived", "name": "$type", "type": "@identity", "options": { "key": "type" } },
 *     { "kind": "field", "name": "firstName" },
 *     { "kind": "field", "name": "lastName" },
 *     { "kind": "derived", "name": "constructor", "type": "@constructor" }
 *   ]
 * }
 * ```
 *
 * :::
 *
 * Passing a `type` overrides the derived name, and `{ legacy: true }`
 * compiles to a {@link LegacyResourceSchema} instead:
 *
 * ::: code-group
 *
 * ```ts [post.ts]
 * import { Resource, field } from '@warp-drive/schema-dsl';
 *
 * @Resource('blog-post', { legacy: true })
 * export class Post {
 *   @field declare title: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "type": "blog-post",
 *   "identity": { "kind": "@id", "name": "id" },
 *   "fields": [
 *     { "kind": "field", "name": "title" }
 *   ],
 *   "legacy": true
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link ObjectSchema} decorator.
 *
 * @public
 */
export interface ObjectSchemaOptions {
  /**
   * Reserved for future use. The compiled schema's `identity` is currently
   * determined solely by whether a property on the class is decorated with
   * {@link hash}, not by this option.
   *
   * @public
   */
  hash?: boolean;
}

/**
 * Marks a class as an {@link ObjectSchemaRecord | object schema} &mdash; an
 * embedded structure with no independent identity of its own, for use as
 * the value of an {@link object | @object} or {@link alias} field on a
 * resource.
 *
 * The object's `type` is derived from the class name (dasherized) unless a
 * `type` string is passed explicitly. Its `identity` is `null` unless a
 * property is decorated with {@link hash}, in which case that compiled
 * {@link HashField} becomes the identity.
 *
 * Each decorated property on the class contributes one entry to the
 * compiled `fields` array, in declaration order.
 *
 * @example
 * ::: code-group
 *
 * ```ts [address.ts]
 * import { ObjectSchema, field } from '@warp-drive/schema-dsl';
 *
 * @ObjectSchema
 * export class Address {
 *   @field declare street: string;
 *   @field declare city: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "type": "address",
 *   "identity": null,
 *   "fields": [
 *     { "kind": "field", "name": "street" },
 *     { "kind": "field", "name": "city" }
 *   ]
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link Trait} decorator.
 *
 * @public
 */
export interface TraitOptions {
  /**
   * The mode this trait is valid for use with: `'polaris'` compiles a
   * {@link PolarisTrait}, `'legacy'` compiles a {@link LegacyTrait}.
   *
   * @public
   */
  mode?: 'legacy' | 'polaris';
}

/**
 * Marks a class as a {@link TraitRecord | trait} &mdash; a reusable
 * collection of fields that can be composed onto a {@link Resource} (or
 * another {@link Trait}) via {@link trait}.
 *
 * The trait's `name` is derived from the class name (dasherized) unless a
 * `name` string is passed explicitly. Its `mode` defaults to `'polaris'`.
 *
 * Each decorated property on the class contributes one entry to the
 * compiled `fields` array, in declaration order. Unlike {@link Resource},
 * no `$type` or `constructor` {@link DerivedField} is ever added, since a
 * trait's fields are merged into whichever resource composes it.
 *
 * @example
 * ::: code-group
 *
 * ```ts [timestamped.ts]
 * import { Trait, field } from '@warp-drive/schema-dsl';
 *
 * @Trait
 * export class Timestamped {
 *   @field({ type: 'date-time' }) declare createdAt: string;
 *   @field({ type: 'date-time' }) declare updatedAt: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "name": "timestamped",
 *   "mode": "polaris",
 *   "fields": [
 *     { "kind": "field", "name": "createdAt", "type": "date-time" },
 *     { "kind": "field", "name": "updatedAt", "type": "date-time" }
 *   ]
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
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
 * Composes one or more {@link Trait}-decorated classes onto a
 * {@link Resource} or {@link Trait}, populating the compiled schema's
 * `traits` array with each composed trait's (dasherized) name.
 *
 * Traits passed here must still be registered with the store (e.g. via
 * `store.schema.registerTrait`) separately; this decorator only records
 * which traits a resource depends on, it does not merge their fields into
 * the compiled output.
 *
 * Has no effect when stacked on an {@link ObjectSchema}-decorated class:
 * object schemas do not compile a `traits` array.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, trait } from '@warp-drive/schema-dsl';
 *
 * import { Timestamped } from './timestamped.ts';
 *
 * @Resource
 * @trait(Timestamped)
 * export class User {
 *   @field declare name: string;
 * }
 * ```
 *
 * ```json [compiled schema (excerpt)]
 * {
 *   "type": "user",
 *   "traits": ["timestamped"]
 * }
 * ```
 *
 * :::
 *
 * @param traits - the {@link Trait}-decorated classes to compose
 * @since 5.9.0
 * @public
 */
export function trait(..._traits: AnyConstructor[]): (target: AnyConstructor) => void {
  return function (_target: AnyConstructor): void {};
}

// ---------------------------------------------------------------------------
// @field
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link field} decorator.
 *
 * @public
 */
export interface FieldOptions {
  /**
   * The name of a {@link Transformation} to compile onto the field's `type`.
   *
   * @public
   */
  type?: string;

  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name. Compiles onto the field's `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;
}

/**
 * Marks a property as a {@link GenericField} &mdash; a plain field for
 * primitive values (strings, numbers, booleans) &mdash; on a
 * {@link Resource}, {@link ObjectSchema}, or {@link Trait}.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare firstName: string;
 *   @field({ type: 'date-time', sourceKey: 'created_at' }) declare createdAt: string;
 * }
 * ```
 *
 * ```json [compiled fields]
 * [
 *   { "kind": "field", "name": "firstName" },
 *   { "kind": "field", "name": "createdAt", "type": "date-time", "sourceKey": "created_at" }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link id} decorator.
 *
 * @public
 */
export interface IdOptions {
  /**
   * The name of the identity field as returned by the API, if it differs
   * from the decorated property's name. Compiles onto the
   * {@link IdentityField}'s `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;
}

/**
 * Marks a property as the {@link IdentityField | identity field} for a
 * {@link Resource}, overriding the default `{ kind: '@id', name: 'id' }`
 * identity with `{ kind: '@id', name: <decorated property> }`.
 *
 * Only needed when a resource's primary key is not named `id`; most
 * resources can rely on {@link Resource}'s default identity instead.
 *
 * @example
 * ::: code-group
 *
 * ```ts [post.ts]
 * import { Resource, id, field } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class Post {
 *   @id declare uuid: string;
 *   @field declare title: string;
 * }
 * ```
 *
 * ```json [compiled schema (excerpt)]
 * {
 *   "type": "post",
 *   "identity": { "kind": "@id", "name": "uuid" }
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 */
export function id(target: object, key: string): void;
export function id(options: IdOptions): (target: object, key: string) => void;
export function id(_targetOrOptions?: unknown, _propertyKey?: string): void | ((target: object, key: string) => void) {}

// ---------------------------------------------------------------------------
// @local
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link local} decorator.
 *
 * @public
 */
export interface LocalOptions {
  /**
   * The value to use for the field until it is first set. Compiles onto
   * the {@link LocalField}'s `options.defaultValue`.
   *
   * @public
   */
  defaultValue?: PrimitiveValue;
}

/**
 * Marks a property as a {@link LocalField} &mdash; state that lives only on
 * the record instance, is never read from or written to the cache, and is
 * never sent to the server.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, local } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare name: string;
 *   @local declare isEditing: boolean;
 *   @local({ defaultValue: 0 }) declare dirtyCount: number;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "@local", "name": "isEditing" },
 *   { "kind": "@local", "name": "dirtyCount", "options": { "defaultValue": 0 } }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link hash} decorator.
 *
 * @public
 */
export interface HashOptions {
  /**
   * The name of a {@link HashFn} registered with the schema service, used
   * to compute this field's value from the object's cache data.
   *
   * @public
   */
  type: string;
}

/**
 * Marks a property as the {@link HashField} used to compute the identity of
 * an {@link ObjectSchema}. At most one property per object schema may use
 * this decorator, and doing so becomes that schema's `identity`.
 *
 * @example
 * ::: code-group
 *
 * ```ts [address.ts]
 * import { ObjectSchema, hash, field } from '@warp-drive/schema-dsl';
 *
 * @ObjectSchema
 * export class Address {
 *   @hash({ type: 'address-hash' }) declare addressHash: string;
 *   @field declare street: string;
 * }
 * ```
 *
 * ```json [compiled schema (excerpt)]
 * {
 *   "type": "address",
 *   "identity": { "kind": "@hash", "name": "addressHash", "type": "address-hash" }
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link object} decorator.
 *
 * @public
 */
export interface ObjectFieldOptions {
  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name. Compiles onto the {@link ObjectField}'s
   * `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;

  /**
   * The name of a {@link Transformation} to pass the entire object through
   * before displaying or serializing it. Compiles onto the
   * {@link ObjectField}'s `type`.
   *
   * @public
   */
  type?: string;
}

/**
 * Marks a property as an {@link ObjectField} &mdash; an object whose keys
 * point to primitive values with no well-defined shape. For objects with a
 * well-defined shape, define an {@link ObjectSchema} instead.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, object } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare name: string;
 *   @object declare metadata: Record<string, unknown>;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "object", "name": "metadata" }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link array} decorator.
 *
 * @public
 */
export interface ArrayFieldOptions {
  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name. Compiles onto the {@link ArrayField}'s
   * `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;

  /**
   * The name of a {@link Transformation} to pass each item in the array
   * through before displaying or serializing it. Compiles onto the
   * {@link ArrayField}'s `type`.
   *
   * @public
   */
  type?: string;
}

/**
 * Marks a property as an {@link ArrayField} &mdash; an array of primitive
 * values. For arrays of well-defined objects, use a schema array instead.
 *
 * @example
 * ::: code-group
 *
 * ```ts [post.ts]
 * import { Resource, field, array } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class Post {
 *   @field declare title: string;
 *   @array declare tags: string[];
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "array", "name": "tags" }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link derived} decorator.
 *
 * @public
 */
export interface DerivedOptions {
  /**
   * The name of a {@link Derivation} registered with the schema service,
   * used to compute this field's value. Compiles onto the
   * {@link DerivedField}'s `type`.
   *
   * @public
   */
  type: string;

  /**
   * Options to pass to the derivation. Must comply with the specific
   * derivation's options schema.
   *
   * @public
   */
  options?: Record<string, unknown>;
}

/**
 * Marks a property as a {@link DerivedField} &mdash; a computed, read-only
 * value derived from other fields. Derived fields are never stored in the
 * cache and are never sent to the server.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, derived } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare firstName: string;
 *   @field declare lastName: string;
 *   @derived({ type: '@concat' }) declare displayName: string;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "derived", "name": "displayName", "type": "@concat" }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link alias} decorator, describing the field
 * being aliased.
 *
 * @public
 */
export interface AliasOptions {
  /**
   * The `kind` of the field being aliased, e.g. `'field'`, `'object'`, or
   * `'array'`.
   *
   * @public
   */
  kind: string;

  /**
   * The `name` of the field being aliased.
   *
   * @public
   */
  name: string;

  /**
   * The name of a {@link Transformation} associated with the aliased field.
   *
   * @public
   */
  type?: string;

  /**
   * The `sourceKey` of the field being aliased, if it differs from `name`.
   *
   * @public
   */
  sourceKey?: string;
}

/**
 * Marks a property as an alias &mdash; compiling to a
 * {@link LegacyAliasField}, {@link PolarisAliasField}, or
 * {@link ObjectAliasField} depending on the schema it's declared on
 * &mdash; that points to another field already present in the schema.
 *
 * Unlike {@link derived}, an alias may write back to its source field when
 * the record is in an editable mode.
 *
 * @example
 * ::: code-group
 *
 * ```ts [product.ts]
 * import { Resource, field, alias } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class Product {
 *   @field({ sourceKey: 'product_name' }) declare name: string;
 *   @alias({ kind: 'field', name: 'name' }) declare productName: string;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "field", "name": "name", "sourceKey": "product_name" },
 *   { "kind": "alias", "name": "productName", "type": null, "options": { "kind": "field", "name": "name" } }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link attribute} decorator.
 *
 * @public
 */
export interface AttributeOptions {
  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name. Compiles onto the
   * {@link LegacyAttributeField}'s `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;

  /**
   * The name of a legacy transform to compile onto the field's `type`.
   *
   * @public
   */
  type?: string;
}

/**
 * > [!CAUTION]
 * > This decorator is LEGACY. Prefer {@link field} for new schemas; only use
 * > this decorator on resources decorated with `@Resource({ legacy: true })`.
 *
 * Marks a property as a {@link LegacyAttributeField} for use with
 * `@warp-drive/legacy/model`.
 *
 * @example
 * ::: code-group
 *
 * ```ts [comment.ts]
 * import { Resource, attribute } from '@warp-drive/schema-dsl';
 *
 * @Resource({ legacy: true })
 * export class Comment {
 *   @attribute({ type: 'string' }) declare author: string;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "attribute", "name": "author", "type": "string" }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link belongsTo} decorator.
 *
 * @public
 */
export interface BelongsToOptions {
  /**
   * The name of the related resource's `type`.
   *
   * @public
   */
  type: string;

  /**
   * The name of the inverse field on the related resource, or `null` if
   * the relationship is unidirectional.
   *
   * @public
   */
  inverse: string | null;

  /**
   * Whether the relationship is async. Compiles onto the
   * {@link LegacyBelongsToField}'s `options.async`, defaulting to `false`.
   *
   * @public
   */
  async?: boolean;

  /**
   * Whether this field satisfies a polymorphic relationship on another
   * resource, meaning it can point to multiple types of resources so long
   * as they implement the trait or abstract type named by `type`.
   *
   * @public
   */
  polymorphic?: boolean;

  /**
   * If this field is polymorphic, the trait or abstract type that this
   * resource implements.
   *
   * @public
   */
  as?: string;

  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name.
   *
   * @public
   */
  sourceKey?: string;
}

/**
 * > [!CAUTION]
 * > This decorator is LEGACY, and only valid on resources decorated with
 * > `@Resource({ legacy: true })`.
 *
 * Marks a property as a {@link LegacyBelongsToField} for use with
 * `@warp-drive/legacy/model`.
 *
 * @example
 * ::: code-group
 *
 * ```ts [comment.ts]
 * import { Resource, belongsTo } from '@warp-drive/schema-dsl';
 *
 * @Resource({ legacy: true })
 * export class Comment {
 *   @belongsTo({ type: 'post', inverse: 'comments', async: true })
 *   declare post: unknown;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   {
 *     "kind": "belongsTo",
 *     "name": "post",
 *     "type": "post",
 *     "options": { "async": true, "inverse": "comments" }
 *   }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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

/**
 * Options accepted by the {@link hasMany} decorator.
 *
 * @public
 */
export interface HasManyOptions {
  /**
   * The name of the related resources' `type`.
   *
   * @public
   */
  type: string;

  /**
   * The name of the inverse field on the related resources, or `null` if
   * the relationship is unidirectional.
   *
   * @public
   */
  inverse: string | null;

  /**
   * Whether the relationship is async. Compiles onto the
   * {@link LegacyHasManyField}'s `options.async`, defaulting to `false`.
   *
   * @public
   */
  async?: boolean;

  /**
   * Whether this field satisfies a polymorphic relationship on another
   * resource, meaning it can point to multiple types of resources so long
   * as they implement the trait or abstract type named by `type`.
   *
   * @public
   */
  polymorphic?: boolean;

  /**
   * If this field is polymorphic, the trait or abstract type that this
   * resource implements.
   *
   * @public
   */
  as?: string;

  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name.
   *
   * @public
   */
  sourceKey?: string;
}

/**
 * > [!CAUTION]
 * > This decorator is LEGACY, and only valid on resources decorated with
 * > `@Resource({ legacy: true })`.
 *
 * Marks a property as a {@link LegacyHasManyField} for use with
 * `@warp-drive/legacy/model`.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, hasMany } from '@warp-drive/schema-dsl';
 *
 * @Resource({ legacy: true })
 * export class User {
 *   @hasMany({ type: 'comment', inverse: null, async: false })
 *   declare replies: unknown[];
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   {
 *     "kind": "hasMany",
 *     "name": "replies",
 *     "type": "comment",
 *     "options": { "async": false, "inverse": null }
 *   }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
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
 * Reserved for future compile-time type derivation (e.g. omitting a field
 * from a resource's generated create/edit variant types). Currently a
 * no-op: it has no effect on the compiled `JSON` schema, and stacking it
 * with a field decorator like {@link field} changes nothing about that
 * field's compiled output.
 *
 * @since 5.9.0
 * @public
 */
export function readonly(target: object, key: string): void;
export function readonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Reserved for future compile-time type derivation (e.g. marking a field
 * optional in a resource's generated create variant type). Currently a
 * no-op: it has no effect on the compiled `JSON` schema, and stacking it
 * with a field decorator like {@link field} changes nothing about that
 * field's compiled output.
 *
 * @since 5.9.0
 * @public
 */
export function optional(target: object, key: string): void;
export function optional(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Reserved for future compile-time type derivation (e.g. omitting a field
 * from a resource's generated edit variant type). Currently a no-op: it has
 * no effect on the compiled `JSON` schema, and stacking it with a field
 * decorator like {@link field} changes nothing about that field's compiled
 * output.
 *
 * @since 5.9.0
 * @public
 */
export function createonly(target: object, key: string): void;
export function createonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}

/**
 * Reserved for future compile-time type derivation (e.g. omitting a field
 * from a resource's generated create variant type). Currently a no-op: it
 * has no effect on the compiled `JSON` schema, and stacking it with a field
 * decorator like {@link field} changes nothing about that field's compiled
 * output.
 *
 * @since 5.9.0
 * @public
 */
export function editonly(target: object, key: string): void;
export function editonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
