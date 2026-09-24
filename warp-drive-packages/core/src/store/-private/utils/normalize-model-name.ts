import { deprecate } from '@ember/debug';

import { DEPRECATE_NON_STRICT_TYPES } from '@warp-drive/core/build-config/deprecations';

import { dasherize } from '../../../utils/string.ts';

/**
 * Normalizes a resource `type` to its dasherized form, e.g. `myClass` to
 * `my-class`. Re-exported elsewhere as `_deprecatingNormalize`.
 *
 * When `DEPRECATE_NON_STRICT_TYPES` is enabled, dasherizes `type` and issues
 * a deprecation if it was not already normalized. Otherwise, `type` is
 * returned unchanged and callers are expected to have already normalized it.
 *
 * @private
 */
export function normalizeModelName(type: string): string {
  if (DEPRECATE_NON_STRICT_TYPES) {
    const result = dasherize(type);

    deprecate(
      `The resource type '${type}' is not normalized. Update your application code to use '${result}' instead of '${type}'.`,
      result === type,
      {
        id: 'ember-data:deprecate-non-strict-types',
        until: '6.0',
        for: 'ember-data',
        since: {
          available: '4.13',
          enabled: '5.3',
        },
      }
    );

    return result;
  }

  return type;
}
