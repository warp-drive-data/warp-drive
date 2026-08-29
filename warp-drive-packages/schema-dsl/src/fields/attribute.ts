/* oxlint-disable no-unused-vars */
import type { LegacyAttributeField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

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
 * @decorator
 */
export function attribute(target: object, key: string): void;
export function attribute(options: AttributeOptions): (target: object, key: string) => void;
export function attribute(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
