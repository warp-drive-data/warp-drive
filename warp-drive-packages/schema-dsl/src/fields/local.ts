/* eslint-disable @typescript-eslint/no-unused-vars -- imported only for {@link} cross-references in doc comments */
import type { LocalField } from '@warp-drive/core/types/schema/fields';

/* eslint-enable @typescript-eslint/no-unused-vars */
import type { PrimitiveValue } from '../-private/types.ts';

/**
 * Options accepted by the {@link local} decorator.
 *
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
 * Marks a property as a {@link LocalField} &mdash; state that lives only on
 * the record instance, is never read from or written to the cache, and is
 * never sent to the server.
 *
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
 */
export function local(target: object, key: string): void;
export function local(options: LocalOptions): (target: object, key: string) => void;
export function local(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
