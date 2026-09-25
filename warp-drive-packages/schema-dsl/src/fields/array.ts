/* oxlint-disable no-unused-vars */
import type { Transformation } from '@warp-drive/core/types/schema/concepts';
import type { ArrayField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

/**
 * Options accepted by the {@link array} decorator.
 *
 * @summary Options for the `@array` decorator that set the compiled array field's `sourceKey` and the transformation
 * applied to each item.
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
 * Marks a property as an {@link ArrayField} — an array of primitive
 * values. For arrays of well-defined objects, use {@link schemaArray}.
 *
 * @summary Property decorator that compiles to an array field holding primitive values; use `schemaArray` for arrays of
 * structured objects.
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
