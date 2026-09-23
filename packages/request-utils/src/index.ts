/**
 * @module
 * @mergeModuleWith <project>
 */

import { deprecate } from '@ember/debug';

import {
  type CacheControlValue,
  DefaultCachePolicy,
  parseCacheControl,
  type PolicyConfig,
} from '@warp-drive/core/store';

export * from '@warp-drive/utilities';

export { DefaultCachePolicy as CachePolicy, type PolicyConfig, type CacheControlValue, parseCacheControl };

export class LifetimesService extends DefaultCachePolicy {
  constructor(config: PolicyConfig) {
    deprecate(
      `\`import { LifetimesService } from '@ember-data/request-utils';\` is deprecated, please use \`import { CachePolicy } from '@ember-data/request-utils';\` instead.`,
      false,
      {
        id: 'ember-data:deprecate-lifetimes-service-import',
        since: {
          enabled: '5.4',
          available: '4.13',
        },
        for: 'ember-data',
        until: '6.0',
      }
    );
    super(config);
  }
}
