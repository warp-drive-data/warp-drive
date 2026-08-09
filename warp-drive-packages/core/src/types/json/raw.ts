/**
 * A JSON primitive: a string, number, boolean, or `null`.
 *
 * @public
 */
export type PrimitiveValue = string | number | boolean | null;

/**
 * A plain JSON object, whose values are themselves valid {@link Value}s.
 *
 * @public
 */
export interface ObjectValue {
  [key: string]: Value;
}

/**
 * A JSON array whose members are valid {@link Value}s.
 *
 * @public
 */
export type ArrayValue = Value[];

/**
 * Any valid JSON value: a {@link PrimitiveValue}, an {@link ArrayValue}, or an
 * {@link ObjectValue}.
 *
 * @public
 */
export type Value = PrimitiveValue | ArrayValue | ObjectValue;
