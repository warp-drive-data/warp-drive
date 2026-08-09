import type { WithArrayLike, WithEmberObject } from '../compat/extensions.ts';
import type { Fragment } from './extensions/fragment.ts';
import type { FragmentArray } from './extensions/fragment-array.ts';

/**
 * Adds the classic `EmberObject` API (via {@link WithEmberObject}) and the
 * {@link Fragment} API to the type of a migrated single-fragment resource.
 */
export type WithFragment<T> = T & WithEmberObject<T> & Fragment;
/**
 * Adds Ember's classic array-like API (via {@link WithArrayLike}) and the
 * {@link FragmentArray} API to the type of a migrated fragment-array resource.
 */
export type WithFragmentArray<T extends Fragment> = T & WithArrayLike<T> & FragmentArray<T>;
