import type { Transformation } from '@warp-drive/core/types/schema/concepts';
import type { LegacyAliasField, ObjectAliasField, PolarisAliasField } from '@warp-drive/core/types/schema/fields';

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
 * @decorator
 */
export function alias(options: AliasOptions): (target: object, key: string) => void;
export function alias(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
