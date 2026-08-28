/**
 * Reserved for future compile-time type derivation (e.g. omitting a field
 * from a resource's generated create/edit variant types). Currently a
 * no-op: it has no effect on the compiled `JSON` schema, and stacking it
 * with a field decorator like {@link field} changes nothing about that
 * field's compiled output.
 *
 * @since 5.9.0
 * @public
 */
export function readonly(target: object, key: string): void;
export function readonly(
  _targetOrOptions?: unknown,
  _propertyKey?: string
): void | ((target: object, key: string) => void) {}
