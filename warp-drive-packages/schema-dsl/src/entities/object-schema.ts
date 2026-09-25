/* oxlint-disable no-unused-vars */
import type { HashField, ObjectSchema as ObjectSchemaRecord } from '@warp-drive/core/types/schema/fields';

/* oxlint-enable no-unused-vars */
import type { AnyConstructor } from '../-private/types.ts';

/**
 * Options accepted by the {@link ObjectSchema} decorator.
 *
 * @summary Options for the `ObjectSchema` class decorator; currently only a reserved `hash` flag that has no effect on
 * the compiled object schema.
 * @public
 */
export interface ObjectSchemaOptions {
  /**
   * Reserved for future use. The compiled schema's `identity` is currently
   * determined solely by whether a property on the class is decorated with
   * {@link hash}, not by this option.
   *
   * @public
   */
  hash?: boolean;
}

/**
 * Marks a class as an {@link ObjectSchemaRecord | object schema} — an
 * embedded structure with no independent identity of its own, for use as
 * the value of a {@link schemaObject} or {@link schemaArray} field.
 *
 * The object's `type` is derived from the class name (dasherized) unless a
 * `type` string is passed explicitly. Its `identity` is `null` unless a
 * property is decorated with {@link hash}, in which case that compiled
 * {@link HashField} becomes the identity.
 *
 * Each decorated property on the class contributes one entry to the
 * compiled `fields` array, in declaration order.
 *
 * @summary Class decorator that compiles a class into an object schema for embedded, identity-less data used as the
 * value of `schemaObject` and `schemaArray` fields.
 * @example
 * ::: code-group
 *
 * ```ts [address.ts]
 * import { ObjectSchema, field } from '@warp-drive/schema-dsl';
 *
 * @ObjectSchema
 * export class Address {
 *   @field declare street: string;
 *   @field declare city: string;
 * }
 * ```
 *
 * ```json [compiled schema]
 * {
 *   "type": "address",
 *   "identity": null,
 *   "fields": [
 *     { "kind": "field", "name": "street" },
 *     { "kind": "field", "name": "city" }
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
export function ObjectSchema(target: AnyConstructor): void;
export function ObjectSchema(type: string, options?: ObjectSchemaOptions): (target: AnyConstructor) => void;
export function ObjectSchema(options: ObjectSchemaOptions): (target: AnyConstructor) => void;
export function ObjectSchema(
  _targetOrTypeOrOptions?: unknown,
  _maybeOptions?: unknown
): void | ((target: AnyConstructor) => void) {}
