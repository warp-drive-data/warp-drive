import type { IdentityField } from '@warp-drive/core/types/schema/fields';

/**
 * Options accepted by the {@link id} decorator.
 *
 * @public
 */
export interface IdOptions {
  /**
   * The name of the identity field as returned by the API, if it differs
   * from the decorated property's name. Compiles onto the
   * {@link IdentityField}'s `sourceKey`.
   *
   * @public
   */
  sourceKey?: string;
}

/**
 * Marks a property as the {@link IdentityField | identity field} for a
 * {@link Resource}, overriding the default `{ kind: '@id', name: 'id' }`
 * identity with `{ kind: '@id', name: <decorated property> }`.
 *
 * Only needed when a resource's primary key is not named `id`; most
 * resources can rely on {@link Resource}'s default identity instead.
 *
 * @example
 * ::: code-group
 *
 * ```ts [post.ts]
 * import { Resource, id, field } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * export class Post {
 *   @id declare uuid: string;
 *   @field declare title: string;
 * }
 * ```
 *
 * ```json [compiled schema (excerpt)]
 * {
 *   "type": "post",
 *   "identity": { "kind": "@id", "name": "uuid" }
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 * @decorator
 */
export function id(target: object, key: string): void;
export function id(options: IdOptions): (target: object, key: string) => void;
export function id(_targetOrOptions?: unknown, _propertyKey?: string): void | ((target: object, key: string) => void) {}
