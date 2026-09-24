import { cached, tracked } from '@glimmer/tracking';

import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';
import type { PrivateReactiveResource } from '@warp-drive/core/reactive/-private';
import { Context } from '@warp-drive/core/reactive/-private';
import type { Value } from '@warp-drive/core/types/json/raw';

import type Model from '../../model.ts';

/**
 * The features added to an object resource by {@link FragmentExtension}, providing
 * a subset of the legacy `ModelFragments` fragment API for migrated resources.
 */
export class Fragment {
  // We might want to check the parent values once we move this code to warp-drive.
  /**
   * Whether this fragment is in the process of being destroyed.
   */
  @tracked isDestroying = false;
  /**
   * Whether this fragment has been destroyed.
   */
  @tracked isDestroyed = false;

  /**
   * Whether this fragment (or the attribute it is rooted at) has uncommitted changes.
   */
  @cached
  get hasDirtyAttributes(): boolean {
    const { path, resourceKey, store } = (this as unknown as PrivateReactiveResource)[Context];
    const record = store.peekRecord(resourceKey) as Model;

    if (record.hasDirtyAttributes && path) {
      const root = path.at(0) as string;
      return root in record.changedAttributes();
    }

    return false;
  }

  /**
   * Always `true`. Used to distinguish fragments from other resources.
   */
  get isFragment() {
    return true;
  }

  /**
   * The resource type of this fragment, if known.
   */
  get $type(): string | null | undefined {
    const { field } = (this as unknown as PrivateReactiveResource)[Context];
    return field?.type;
  }

  /**
   * Reverts this fragment's attribute back to its last known remote value.
   */
  rollbackAttributes(this: PrivateReactiveResource): void {
    const { path, resourceKey, store } = this[Context];

    if (path) {
      const oldValue = store.cache.getRemoteAttr(resourceKey, path) as Value;
      store.cache.setAttr(resourceKey, path, oldValue);
    }
  }
}

/**
 * A schema extension that adds the {@link Fragment} API to migrated
 * `ModelFragments` object resources.
 */
export const FragmentExtension: {
  /**
   * This extension applies to `'object'` schemas.
   */
  kind: 'object';
  /**
   * The registered name of this extension.
   */
  name: 'fragment';
  /**
   * The features ({@link Fragment}) added by this extension.
   */
  features: typeof Fragment;
} = {
  kind: 'object' as const,
  name: 'fragment' as const,
  features: Fragment,
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentExtension;
