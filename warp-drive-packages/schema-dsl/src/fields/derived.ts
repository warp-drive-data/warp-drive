import type { Derivation } from '@warp-drive/core/types/schema/concepts';
import type { DerivedField } from '@warp-drive/core/types/schema/fields';

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
 * @decorator
 */
export function derived(options: DerivedOptions): (target: object, key: string) => void;
export function derived(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
