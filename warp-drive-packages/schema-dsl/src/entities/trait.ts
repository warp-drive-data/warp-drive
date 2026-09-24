/* oxlint-disable no-unused-vars */
import type {
  DerivedField,
  LegacyTrait,
  PolarisTrait,
  Trait as TraitRecord,
} from '@warp-drive/core/types/schema/fields';

/* oxlint-enable no-unused-vars */
import type { AnyConstructor } from '../-private/types.ts';

/**
 * Options accepted by the {@link Trait} decorator.
 *
 * @public
 */
export interface TraitOptions {
  /**
   * The mode this trait is valid for use with: `'polaris'` compiles a
   * {@link PolarisTrait}, `'legacy'` compiles a {@link LegacyTrait}.
   *
   * @public
   */
  mode?: 'legacy' | 'polaris';
}

/**
 * Marks a class as a {@link TraitRecord | trait} &mdash; a reusable
 * collection of fields that can be composed onto a {@link Resource} (or
 * another {@link Trait}) via {@link trait}.
 *
 * The trait's `name` is derived from the class name (dasherized) unless a
 * `name` string is passed explicitly. Its `mode` defaults to `'polaris'`.
 *
 * Each decorated property on the class contributes one entry to the
 * compiled `fields` array, in declaration order. Unlike {@link Resource},
 * no `$type` or `constructor` {@link DerivedField} is ever added, since a
 * trait's fields are merged into whichever resource composes it.
 *
 * @example
 * ::: code-group
 *
 * ```ts [timestamped.ts]
 * import { Trait, field } from '@warp-drive/schema-dsl';
 *
 * @Trait
 * export class Timestamped {
 *   @field({ type: 'date-time' }) declare createdAt: string;
 *   @field({ type: 'date-time' }) declare updatedAt: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "name": "timestamped",
 *   "mode": "polaris",
 *   "fields": [
 *     { "kind": "field", "name": "createdAt", "type": "date-time" },
 *     { "kind": "field", "name": "updatedAt", "type": "date-time" }
 *   ]
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
export function Trait(target: AnyConstructor): void;
export function Trait(name: string, options?: TraitOptions): (target: AnyConstructor) => void;
export function Trait(options: TraitOptions): (target: AnyConstructor) => void;
export function Trait(
  _targetOrNameOrOptions?: unknown,
  _maybeOptions?: unknown
): void | ((target: AnyConstructor) => void) {}
