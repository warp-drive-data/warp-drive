/* oxlint-disable no-unused-vars */
import type { Transformation } from '@warp-drive/core/types/schema/concepts';
import type { ObjectField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

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
 * well-defined shape, use {@link schemaObject} with an
 * {@link ObjectSchema} instead.
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
 * @decorator
 */
export function object(target: object, key: string): void;
export function object(options: ObjectFieldOptions): (target: object, key: string) => void;
export function object(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
