/* oxlint-disable no-unused-vars */
import type { LegacyHasManyField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

/**
 * Options accepted by the {@link hasMany} decorator.
 *
 * @summary Options for the legacy `@hasMany` decorator that describe the related type, inverse, async and polymorphic
 * behavior, and `sourceKey`.
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
 * @summary LEGACY property decorator that compiles to a hasMany relationship field, valid only on resources declared
 * with `@Resource({ legacy: true })`.
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
 * @decorator
 */
export function hasMany(options: HasManyOptions): (target: object, key: string) => void;
export function hasMany(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
