import type {
  DerivedField,
  IdentityField,
  LegacyResourceSchema,
  PolarisResourceSchema,
} from '@warp-drive/core/types/schema/fields';

import type { AnyConstructor } from '../-private/types.ts';

/**
 * Options accepted by the {@link Resource} decorator.
 *
 * @public
 */
export interface ResourceOptions {
  /**
   * Compiles the class to a {@link LegacyResourceSchema} for use with
   * `@warp-drive/legacy/model` instead of a {@link PolarisResourceSchema}.
   *
   * Legacy resources omit the `$type` and `constructor` {@link DerivedField}s
   * that {@link Resource} otherwise adds automatically.
   *
   * @public
   */
  legacy?: boolean;

  /**
   * The name of the property that serves as this resource's primary key,
   * used only when no property on the class is decorated with {@link id}.
   *
   * Compiles to `identity: { kind: '@id', name: identityField }`. When
   * omitted (and no {@link id} is present), the identity defaults to
   * `{ kind: '@id', name: 'id' }`.
   *
   * @public
   */
  identityField?: string;
}

/**
 * Marks a class as a resource schema &mdash; a primary resource with its own
 * unique {@link IdentityField | identity} &mdash; compiling it to a
 * {@link PolarisResourceSchema}, or a {@link LegacyResourceSchema} when
 * {@link ResourceOptions.legacy} is set.
 *
 * The resource's `type` is derived from the class name (dasherized, e.g.
 * `UserProfile` compiles to `'user-profile'`) unless a `type` string is
 * passed explicitly. Its identity defaults to `{ kind: '@id', name: 'id' }`
 * unless a property is decorated with {@link id}, or
 * {@link ResourceOptions.identityField} names a different property.
 *
 * Each decorated property on the class contributes one entry to the
 * compiled `fields` array, in declaration order. Unless
 * {@link ResourceOptions.legacy} is set, a `$type` and a `constructor`
 * {@link DerivedField} are appended automatically: the first before any
 * declared fields, the second after.
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
 *   @field declare lastName: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "type": "user",
 *   "identity": { "kind": "@id", "name": "id" },
 *   "fields": [
 *     { "kind": "derived", "name": "$type", "type": "@identity", "options": { "key": "type" } },
 *     { "kind": "field", "name": "firstName" },
 *     { "kind": "field", "name": "lastName" },
 *     { "kind": "derived", "name": "constructor", "type": "@constructor" }
 *   ]
 * }
 * ```
 *
 * :::
 *
 * Passing a `type` overrides the derived name, and `{ legacy: true }`
 * compiles to a {@link LegacyResourceSchema} instead:
 *
 * ::: code-group
 *
 * ```ts [post.ts]
 * import { Resource, field } from '@warp-drive/schema-dsl';
 *
 * @Resource('blog-post', { legacy: true })
 * export class Post {
 *   @field declare title: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "type": "blog-post",
 *   "identity": { "kind": "@id", "name": "id" },
 *   "fields": [
 *     { "kind": "field", "name": "title" }
 *   ],
 *   "legacy": true
 * }
 * ```
 *
 * :::
 *
 * @since 5.9.0
 * @public
 * @classDecorator
 * @group Entity Decorators
 */
export function Resource(target: AnyConstructor): void;
export function Resource(type: string, options?: ResourceOptions): (target: AnyConstructor) => void;
export function Resource(options: ResourceOptions): (target: AnyConstructor) => void;
export function Resource(
  _targetOrTypeOrOptions?: unknown,
  _maybeOptions?: unknown
): void | ((target: AnyConstructor) => void) {}
