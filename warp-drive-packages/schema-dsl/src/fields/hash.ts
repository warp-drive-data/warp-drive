/* oxlint-disable no-unused-vars */
import type { HashFn } from '@warp-drive/core/types/schema/concepts';
import type { HashField } from '@warp-drive/core/types/schema/fields';
/* oxlint-enable no-unused-vars */

/**
 * Options accepted by the {@link hash} decorator.
 *
 * @public
 */
export interface HashOptions {
  /**
   * The name of a {@link HashFn} registered with the schema service, used
   * to compute this field's value from the object's cache data.
   *
   * @public
   */
  type: string;
}

/**
 * Marks a property as the {@link HashField} used to compute the identity of
 * an {@link ObjectSchema}. At most one property per object schema may use
 * this decorator, and doing so becomes that schema's `identity`.
 *
 * @example
 * ::: code-group
 *
 * ```ts [address.ts]
 * import { ObjectSchema, hash, field } from '@warp-drive/schema-dsl';
 *
 * @ObjectSchema
 * export class Address {
 *   @hash({ type: 'address-hash' }) declare addressHash: string;
 *   @field declare street: string;
 * }
 * ```
 *
 * ```json [compiled schema (excerpt)]
 * {
 *   "type": "address",
 *   "identity": { "kind": "@hash", "name": "addressHash", "type": "address-hash" }
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 * @decorator
 */
export function hash(options: HashOptions): (target: object, key: string) => void;
export function hash(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
