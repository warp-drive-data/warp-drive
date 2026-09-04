/* oxlint-disable no-unused-vars */
import type { HashFn } from '@warp-drive/core/types/schema/concepts';
import type { SchemaArrayField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

/**
 * Options accepted by the {@link schemaArray} decorator.
 *
 * @public
 */
export interface SchemaArrayOptions {
  /**
   * If the field is not polymorphic, the `type` of the {@link ObjectSchema}
   * that describes each element.
   *
   * If the field is polymorphic and {@link SchemaArrayOptions.typeField | typeField}
   * is `'@hash'`, the name of the {@link HashFn} used to compute each
   * element's type from the raw cache value.
   *
   * If the field is polymorphic and `typeField` is a payload key, this may
   * be omitted (compiles to `null`). Runtime reads the type from that key.
   *
   * Compiles onto the {@link SchemaArrayField}'s `type`.
   *
   * @public
   */
  type?: string | null;

  /**
   * The name of the field as returned by the API, if it differs from the
   * decorated property's name. Compiles onto the
   * {@link SchemaArrayField}'s `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;

  /**
   * Whether each element may be a different object-schema type.
   * Compiles onto the {@link SchemaArrayField}'s `options.polymorphic`.
   *
   * This is not resource-relationship polymorphism: there is no inverse,
   * no `async`, and no `as` trait. Runtime picks each element's object
   * schema by reading {@link SchemaArrayOptions.typeField | typeField}
   * from the raw value, or by running the hash function named by `type`
   * when `typeField` is `'@hash'`.
   *
   * @public
   */
  polymorphic?: boolean;

  /**
   * When `polymorphic` is true, the key on each raw element that holds
   * the object-schema type, or `'@hash'` to compute it.
   *
   * Compiles onto the {@link SchemaArrayField}'s `options.type`.
   * Runtime defaults to `'type'` when this is omitted.
   *
   * Named `typeField` on the decorator so it does not collide with
   * {@link SchemaArrayOptions.type | type} (the object-schema or hash
   * function name).
   *
   * @public
   */
  typeField?: string;

  /**
   * How the array decides that a cache object is the same schema-object
   * it already instantiated. Compiles onto the
   * {@link SchemaArrayField}'s `options.key`. Runtime defaults to
   * `'@identity'`.
   *
   * - `'@identity'` — referential identity of the cached object
   * - `'@index'` — the element's index in the array
   * - `'@hash'` — the `@hash` function on the contained object schema
   * - a field name — a `kind: 'field'` on the contained object schema
   *
   * @public
   */
  key?: '@identity' | '@index' | '@hash' | string;

  /**
   * If true, a missing cache value becomes `[]` instead of `null`.
   * Compiles onto the {@link SchemaArrayField}'s `options.defaultValue`.
   *
   * @public
   */
  defaultValue?: boolean;
}

/**
 * Marks a property as a {@link SchemaArrayField} &mdash; an array of
 * embedded objects whose shape is described by an {@link ObjectSchema}.
 *
 * This is not a relationship. `@hasMany` / `CollectionField` point at
 * other resources by identity. A schema-array stores the objects inline
 * on the parent; its elements have no identity of their own.
 *
 * For an array of primitives with no schema, use {@link array} instead.
 *
 * @example
 * ::: code-group
 *
 * ```ts [post.ts]
 * import { Resource, field, schemaArray } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class Post {
 *   @field declare title: string;
 *   @schemaArray({ type: 'address', key: '@index', defaultValue: true })
 *   declare locations: Address[];
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   {
 *     "kind": "schema-array",
 *     "name": "locations",
 *     "type": "address",
 *     "options": { "key": "@index", "defaultValue": true }
 *   }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 * @decorator
 */
export function schemaArray(options: SchemaArrayOptions): (target: object, key: string) => void;
export function schemaArray(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
