/**
 * @module
 * @summary Types for JSON values: `PrimitiveValue`, `ObjectValue`, `ArrayValue` and their `Value` union.
 */

/**
 * A JSON primitive: a string, number, boolean, or `null`.
 *
 * @summary A JSON primitive (string, number, boolean, or `null`), the scalar case of the JSON `Value` type.
 * @public
 */
export type PrimitiveValue = string | number | boolean | null;

/**
 * A plain JSON object, whose values are themselves valid {@link Value}s.
 *
 * @summary A plain JSON object whose property values are all JSON values.
 * @public
 */
export interface ObjectValue {
  [key: string]: Value;
}

/**
 * A JSON array whose members are valid {@link Value}s.
 *
 * @summary A JSON array whose members are all JSON values.
 * @public
 */
export type ArrayValue = Value[];

/**
 * Any valid JSON value: a {@link PrimitiveValue}, an {@link ArrayValue}, or an
 * {@link ObjectValue}.
 *
 * @summary Any JSON-serializable value (primitive, array, or object), used for raw field and payload data
 * throughout WarpDrive.
 * @public
 */
export type Value = PrimitiveValue | ArrayValue | ObjectValue;
