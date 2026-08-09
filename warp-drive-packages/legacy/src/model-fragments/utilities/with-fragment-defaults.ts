/**
 * Used as a helper to setup the relevant parts of a fragment schema
 * and add extensions etc.
 *
 * @param fragmentType The type of the fragment
 * @param fragmentName The optional name of the fragment. If not provided, it will default to the fragmentType.
 * @returns The schema for a fragment
 */
export function withFragmentDefaults<FragmentType extends string, FragmentName extends string>(
  fragmentType: FragmentType,
  fragmentName?: FragmentName
): {
  /**
   * This field is a `'schema-object'` field, a single fragment.
   */
  kind: 'schema-object';
  /**
   * The resource type of the fragment.
   */
  type: `fragment:${FragmentType}`;
  /**
   * The name of the fragment field.
   */
  name: FragmentType | FragmentName;
  /**
   * The schema options for this fragment field.
   */
  options: {
    /**
     * The registered object-schema extensions to apply to this fragment.
     */
    objectExtensions: string[];
  };
} {
  return {
    kind: 'schema-object' as const,
    type: `fragment:${fragmentType}` as const,
    name: fragmentName ?? fragmentType,
    options: {
      objectExtensions: ['ember-object', 'fragment'],
    },
  };
}
