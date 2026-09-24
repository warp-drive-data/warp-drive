/* oxlint-disable no-unused-vars */
import type { HashFn } from '@warp-drive/core/types/schema/concepts';
import type { SchemaObjectField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

/**
 * Options accepted by the {@link schemaObject} decorator.
 *
 * @public
 */
export interface SchemaObjectOptions {
  /**
   * If the field is not polymorphic, the `type` of the {@link ObjectSchema}
   * that describes the embedded object.
   *
   * If the field is polymorphic and {@link SchemaObjectOptions.typeField | typeField}
   * is `'@hash'`, the name of the {@link HashFn} used to compute the object
   * type from the raw cache value.
   *
   * If the field is polymorphic and `typeField` is a payload key, this may
   * be omitted (compiles to `null`). Runtime reads the type from that key.
   *
   * Compiles onto the {@link SchemaObjectField}'s `type`.
   *
   * @public
   */
  type?: string | null;

  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name. Compiles onto the
   * {@link SchemaObjectField}'s `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;

  /**
   * Whether this field may contain more than one object-schema type.
   * Compiles onto the {@link SchemaObjectField}'s `options.polymorphic`.
   *
   * This is not resource-relationship polymorphism: there is no inverse,
   * no `async`, and no `as` trait. Runtime picks the object schema by
   * reading {@link SchemaObjectOptions.typeField | typeField} from the
   * raw cache value, or by running the hash function named by `type`
   * when `typeField` is `'@hash'`.
   *
   * @public
   */
  polymorphic?: boolean;

  /**
   * When `polymorphic` is true, the key on the raw cache value that
   * holds the object-schema type, or `'@hash'` to compute it.
   *
   * Compiles onto the {@link SchemaObjectField}'s `options.type`.
   * Runtime defaults to `'type'` when this is omitted.
   *
   * Named `typeField` on the decorator so it does not collide with
   * {@link SchemaObjectOptions.type | type} (the object-schema or hash
   * function name).
   *
   * @public
   */
  typeField?: string;

  /**
   * If true, a missing cache value becomes `{}` instead of `null`.
   * Ignored when `polymorphic` is true. Compiles onto the
   * {@link SchemaObjectField}'s `options.defaultValue`.
   *
   * @public
   */
  defaultValue?: boolean;
}

/**
 * Marks a property as a {@link SchemaObjectField} &mdash; an embedded
 * object whose shape is described by an {@link ObjectSchema}.
 *
 * This is not a relationship. `@belongsTo` / `ResourceField` point at
 * another resource by identity. A schema-object is stored inline on the
 * parent and has no identity of its own.
 *
 * For a bag of primitives with no schema, use {@link object} instead.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, schemaObject } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare name: string;
 *   @schemaObject({ type: 'address' }) declare address: Address;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "schema-object", "name": "address", "type": "address" }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 * @decorator
 */
export function schemaObject(options: SchemaObjectOptions): (target: object, key: string) => void;
export function schemaObject(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
