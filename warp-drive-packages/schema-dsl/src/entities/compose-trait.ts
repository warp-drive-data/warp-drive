import type { AnyConstructor } from '../-private/types.ts';

/**
 * Composes one or more {@link Trait}-decorated classes onto a
 * {@link Resource} or {@link Trait}, populating the compiled schema's
 * `traits` array with each composed trait's (dasherized) name.
 *
 * Traits passed here must still be registered with the store (e.g. via
 * `store.schema.registerTrait`) separately; this decorator only records
 * which traits a resource depends on, it does not merge their fields into
 * the compiled output.
 *
 * Has no effect when stacked on an {@link ObjectSchema}-decorated class:
 * object schemas do not compile a `traits` array.
 *
 * @example
 * ::: code-group
 *
 * ```ts [user.ts]
 * import { Resource, field, trait } from '@warp-drive/schema-dsl';
 *
 * import { Timestamped } from './timestamped.ts';
 *
 * @Resource
 * @trait(Timestamped)
 * export class User {
 *   @field declare name: string;
 * }
 * ```
 *
 * ```json [compiled schema (excerpt)]
 * {
 *   "type": "user",
 *   "traits": ["timestamped"]
 * }
 * ```
 *
 * :::
 *
 * @param traits - the {@link Trait}-decorated classes to compose
 * @since 5.9.0
 * @public
 * @classDecorator
 * @category Entity Decorators
 */
export function trait(..._traits: AnyConstructor[]): (target: AnyConstructor) => void {
  return function (_target: AnyConstructor): void {};
}
