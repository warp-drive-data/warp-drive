/* oxlint-disable no-unused-vars */
import type { Transformation } from '@warp-drive/core/types/schema/concepts';
import type { ArrayField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

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
 * @decorator
 */
export function array(target: object, key: string): void;
export function array(options: ArrayFieldOptions): (target: object, key: string) => void;
export function array(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
