/**
 * Reserved for future compile-time type derivation (e.g. omitting a field
 * from a resource's generated edit variant type). Currently a no-op: it has
 * no effect on the compiled `JSON` schema, and stacking it with a field
 * decorator like {@link field} changes nothing about that field's compiled
 * output.
 *
 * @summary Reserved property decorator for marking a field create-only in future generated types; currently a no-op
 * with no effect on the compiled schema.
 * @since 5.9.0
 * @public
 * @decorator
 */
export function createonly(target: object, key: string): void;
export function createonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
