import { cached, tracked } from '@glimmer/tracking';

import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';
import { Context } from '@warp-drive/core/reactive/-private';
import type { ManagedArray } from '@warp-drive/core/reactive/-private/fields/managed-array';

import type Model from '../../model.ts';
import type { WithFragmentArray } from '../index.ts';
import type { Fragment } from './fragment.ts';

/**
 * The features added to an array resource by {@link FragmentArrayExtension}, providing
 * a subset of the legacy `ModelFragments` fragment-array API for migrated resources.
 */
export class FragmentArray<T extends Fragment> {
  // We might want to check the parent values once we move this code to warp-drive.
  /**
   * Whether this fragment array is in the process of being destroyed.
   */
  @tracked isDestroying = false;
  /**
   * Whether this fragment array has been destroyed.
   */
  @tracked isDestroyed = false;

  /**
   * Whether this fragment array (or any of its members) has uncommitted changes.
   */
  @cached
  get hasDirtyAttributes(): boolean {
    const array = this as unknown as ManagedArray;
    const context = array[Context];
    const { path, resourceKey, store } = context;
    const record = store.peekRecord(resourceKey) as Model;

    if (record.hasDirtyAttributes && path) {
      const root = path.at(0) as string;
      return root in record.changedAttributes();
    }

    return false;
  }

  /**
   * Adds an existing fragment to this array, if one was given.
   */
  addFragment(fragment?: T): Fragment[] | undefined {
    if (!fragment) {
      return;
    }

    return (this as unknown as WithFragmentArray<T>).addObject(fragment);
  }

  /**
   * Appends a new fragment to the end of this array, if one was given.
   */
  createFragment(fragment?: T): Fragment | undefined {
    if (!fragment) {
      return;
    }

    return (this as unknown as WithFragmentArray<T>).pushObject(fragment);
  }

  /**
   * Removes the given fragment from this array, if present.
   */
  removeFragment(fragment?: T): void {
    if (!fragment) {
      return;
    }

    const index = (this as unknown as WithFragmentArray<T>).indexOf(fragment);

    if (index !== -1) {
      (this as unknown as WithFragmentArray<T>).splice(index, 1);
    }
  }

  /**
   * Reverts each member fragment's attribute back to its last known remote value.
   */
  rollbackAttributes(): void {
    for (const fragment of this as unknown as WithFragmentArray<T>) {
      // @ts-expect-error TODO: fix these types
      fragment?.rollbackAttributes?.();
    }
  }
}

/**
 * A schema extension that adds the {@link FragmentArray} API to migrated
 * `ModelFragments` array resources.
 */
export const FragmentArrayExtension: {
  /**
   * This extension applies to `'array'` schemas.
   */
  kind: 'array';
  /**
   * The registered name of this extension.
   */
  name: 'fragment-array';
  /**
   * The features ({@link FragmentArray}) added by this extension.
   */
  features: typeof FragmentArray;
} = {
  kind: 'array' as const,
  name: 'fragment-array' as const,
  features: FragmentArray,
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentArrayExtension;
