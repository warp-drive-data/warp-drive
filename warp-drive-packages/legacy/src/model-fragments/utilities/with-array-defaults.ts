/**
 * Used as a helper to setup the relevant parts of an array
 * schema and add extensions etc.
 *
 * @param primitiveType The primitive type of items in the array
 * @param arrayName The name of the array
 * @returns The schema for an array
 */
export function withArrayDefaults<PrimitiveType extends string, ArrayName extends string>(
  primitiveType: PrimitiveType,
  arrayName: ArrayName
): {
  kind: 'array';
  name: ArrayName;
  type: `array:${PrimitiveType}`;
  options: {
    arrayExtensions: string[];
  };
} {
  return {
    kind: 'array' as const,
    name: arrayName,
    type: `array:${primitiveType}` as const,
    options: {
      arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
    },
  };
}
