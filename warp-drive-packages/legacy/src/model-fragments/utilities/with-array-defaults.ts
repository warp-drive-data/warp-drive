/**
 * Used as a helper to setup the relevant parts of an array
 * schema and add extensions etc.
 *
 * @param arrayName The name of the array
 * @param primitiveType The primitive type of items in the array (optional)
 * @returns The schema for an array
 */
export function withArrayDefaults<ArrayName extends string, PrimitiveType extends string>(
  arrayName: ArrayName,
  primitiveType?: PrimitiveType
): PrimitiveType extends undefined
  ? {
      kind: 'array';
      name: ArrayName;
      type: 'array';
      options: {
        arrayExtensions: string[];
      };
    }
  : {
      kind: 'array';
      name: ArrayName;
      type: `array:${PrimitiveType}`;
      options: {
        arrayExtensions: string[];
      };
    };

export function withArrayDefaults<ArrayName extends string, PrimitiveType extends string>(
  arrayName: ArrayName,
  primitiveType?: PrimitiveType
) {
  const type = primitiveType ? (`array:${primitiveType}` as const) : ('array' as const);
  return {
    kind: 'array' as const,
    name: arrayName,
    type,
    options: {
      arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
    },
  };
}
