import { pluralize, singularize } from '@warp-drive/utilities/string';

/**
 * Used as a helper to setup the relevant parts of a fragment-array
 * schema and add extensions etc.
 *
 * @param fragmentArrayType The type of the fragment-array
 * @param fragmentArrayName The name of the fragment-array
 * @returns The schema for a fragment-array
 */
export function withFragmentArrayDefaults<FragmentArrayType extends string, FragmentArrayName extends string>(
  fragmentArrayType: FragmentArrayType,
  fragmentArrayName?: FragmentArrayName
): {
  /**
   * This field is a `'schema-array'` field, an array of fragments.
   */
  kind: 'schema-array';
  /**
   * The resource type of the fragments contained in this array.
   */
  type: `fragment:${string}`;
  /**
   * The name of the fragment-array field.
   */
  name: string;
  /**
   * The schema options for this fragment-array field.
   */
  options: {
    /**
     * The registered array-schema extensions to apply to this array.
     */
    arrayExtensions: string[];
    /**
     * Whether the array defaults to a non-null empty array when unset.
     */
    defaultValue: boolean;
  };
} {
  return {
    kind: 'schema-array' as const,
    type: `fragment:${singularize(fragmentArrayType)}` as const,
    name: fragmentArrayName ?? pluralize(fragmentArrayType),
    options: {
      arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
      defaultValue: true,
    },
  };
}
