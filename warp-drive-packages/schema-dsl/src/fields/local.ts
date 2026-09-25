/* oxlint-disable no-unused-vars */
import type { LocalField } from '@warp-drive/core/types/schema/fields';

/* oxlint-enable no-unused-vars */
import type { PrimitiveValue } from '../-private/types.ts';

/**
 * Options accepted by the {@link local} decorator.
 *
 * @summary Options for the `@local` decorator that set the local field's value before it is first set.
 * @public
 */
export interface LocalOptions {
  /**
   * The value to use for the field until it is first set. Compiles onto
   * the {@link LocalField}'s `options.defaultValue`.
   *
   * @public
   */
  defaultValue?: PrimitiveValue;
}

/**
 * Marks a property as a {@link LocalField} — state that lives only on
 * the record instance, is never read from or written to the cache, and is
 * never sent to the server.
 *
 * @summary Property decorator that compiles to a local field, instance-only state that is never read from or written to
 * the cache or sent to the server.
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, local } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class User {
 *   @field declare name: string;
 *   @local declare isEditing: boolean;
 *   @local({ defaultValue: 0 }) declare dirtyCount: number;
 * }
 * ```
 *
 * ```json [compiled fields (excerpt)]
 * [
 *   { "kind": "@local", "name": "isEditing" },
 *   { "kind": "@local", "name": "dirtyCount", "options": { "defaultValue": 0 } }
 * ]
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 * @decorator
 */
export function local(target: object, key: string): void;
export function local(options: LocalOptions): (target: object, key: string) => void;
export function local(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
