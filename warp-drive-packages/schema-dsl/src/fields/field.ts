/* eslint-disable @typescript-eslint/no-unused-vars -- imported only for {@link} cross-references in doc comments */
import type { Transformation } from '@warp-drive/core/types/schema/concepts';
import type { GenericField } from '@warp-drive/core/types/schema/fields';
/* eslint-enable @typescript-eslint/no-unused-vars */

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
 * @decorator
 */
export function field(target: object, key: string): void;
export function field(options: FieldOptions): (target: object, key: string) => void;
export function field(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
