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
      /**
       * This field is an `'array'` schema field.
       */
      kind: 'array';
      /**
       * The name of the array field.
       */
      name: ArrayName;
      /**
       * The array's item type, `'array'` since no `primitiveType` was given.
       */
      type: 'array';
      /**
       * The schema options for this array field.
       */
      options: {
        /**
         * The registered array-schema extensions to apply to this array.
         */
        arrayExtensions: string[];
      };
    }
  : {
      /**
       * This field is an `'array'` schema field.
       */
      kind: 'array';
      /**
       * The name of the array field.
       */
      name: ArrayName;
      /**
       * The array's item type, derived from `primitiveType`.
       */
      type: `array:${PrimitiveType}`;
      /**
       * The schema options for this array field.
       */
      options: {
        /**
         * The registered array-schema extensions to apply to this array.
         */
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
