import type ApplicationInstance from '@ember/application/instance';

import type { Store } from '@warp-drive/core';
import type { SchemaService } from '@warp-drive/core/types';

import FragmentArrayExtension from '../extensions/fragment-array.ts';
import FragmentExtension from '../extensions/fragment.ts';

/**
 * Registers the {@link FragmentExtension}/{@link FragmentArrayExtension} schema
 * extensions on the given `SchemaService`, enabling ModelFragments migration support.
 *
 * @public
 */
export function registerFragmentExtensions(schema: SchemaService): void {
  schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(FragmentExtension);
  schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(FragmentArrayExtension);
}

export function initialize(application: ApplicationInstance): void {
  const store = application.lookup('service:store') as Store | undefined;

  if (store) {
    registerFragmentExtensions(store.schema);
  } else {
    // oxlint-disable-next-line no-console
    console.warn(
      'No store service was found, you will need to call `registerFragmentExtensions` manually in your app.'
    );
  }
}

export default {
  name: 'fragment-extensions',
  // the cast is required for isolatedDeclarations to determine this default
  // export's type without inference, even though it's a no-op for `tsc`'s checker
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  initialize: initialize as (application: ApplicationInstance) => void,
};
