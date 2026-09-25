import type { WithArrayLike, WithEmberObject } from '../compat/extensions.ts';
import type { FragmentArray } from './extensions/fragment-array.ts';
import type { Fragment } from './extensions/fragment.ts';

/**
 * Adds the classic `EmberObject` API (via {@link WithEmberObject}) and the
 * {@link Fragment} API to the type of a migrated single-fragment resource.
 *
 * @summary Legacy type for a reactive object migrated from a `ModelFragments` fragment, adding the `EmberObject`
 * and `Fragment` APIs to it.
 */
export type WithFragment<T> = T & WithEmberObject<T> & Fragment;
/**
 * Adds Ember's classic array-like API (via {@link WithArrayLike}) and the
 * {@link FragmentArray} API to the type of a migrated fragment-array resource.
 *
 * @summary Legacy type for a reactive array migrated from a `ModelFragments` fragment array, adding Ember array
 * methods and the `FragmentArray` API to it.
 */
export type WithFragmentArray<T extends Fragment> = T & WithArrayLike<T> & FragmentArray<T>;
