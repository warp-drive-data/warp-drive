/**
 * Reserved for future compile-time type derivation (e.g. marking a field
 * optional in a resource's generated create variant type). Currently a
 * no-op: it has no effect on the compiled `JSON` schema, and stacking it
 * with a field decorator like {@link field} changes nothing about that
 * field's compiled output.
 *
 * @summary Reserved property decorator for marking a field optional in future generated create types; currently a no-op
 * with no effect on the compiled schema.
 * @since 5.9.0
 * @public
 * @decorator
 */
export function optional(target: object, key: string): void;
export function optional(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
