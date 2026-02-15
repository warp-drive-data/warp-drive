/**
 * @module
 * @mergeModuleWith <project>
 */
import { deprecate } from '@ember/debug';

import { dependencySatisfies, importSync, macroCondition } from '@embroider/macros';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type RequestManager, Store } from '@warp-drive/core';
import { DEPRECATE_TRACKING_PACKAGE } from '@warp-drive/core/build-config/deprecations';
import { setupSignals } from '@warp-drive/core/configure';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Handler } from '@warp-drive/core/request';
import { peekTransient } from '@warp-drive/core/types/-private';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Cache } from '@warp-drive/core/types/cache';

export { Store as default };

export {
  type StoreRequestContext,
  CacheHandler,
  type Document,
  type CachePolicy,
  type StoreRequestInput,
  recordIdentifierFor,
  storeFor,
  type DocumentCacheOperation,
  type CacheOperation,
  type NotificationType,
  setIdentifierGenerationMethod,
  setIdentifierUpdateMethod,
  setIdentifierForgetMethod,
  setIdentifierResetMethod,
  setKeyInfoForResource,
} from '@warp-drive/core';

if (DEPRECATE_TRACKING_PACKAGE) {
  let hasEmberDataTracking = false;
  let hasWarpDriveEmber = false;
  let hasRegisteredFromEmberPackage = false;

  if (macroCondition(dependencySatisfies('@warp-drive/ember', '*'))) {
    hasWarpDriveEmber = true;
    hasRegisteredFromEmberPackage = peekTransient('signalHooks') !== null;
  }

  if (macroCondition(dependencySatisfies('@ember-data/tracking', '*'))) {
    hasEmberDataTracking = true;

    if (!hasRegisteredFromEmberPackage) {
      // @ts-expect-error
      const { buildSignalConfig } = importSync('@ember-data/tracking');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setupSignals(buildSignalConfig);
    }
  }

  // we should probably still print here if @ember-data/tracking is present
  if (!hasRegisteredFromEmberPackage) {
    const message = [
      `Using WarpDrive with EmberJS requires configuring it to use Ember's reactivity system.`,
      `Previously this was provided by installing the package '@ember-data/tracking', but this package is now deprecated.`,
      ``,
      `To resolve this deprecation, follow these steps:`,
      hasEmberDataTracking
        ? `- remove "@ember-data/tracking" and (if needed) "@ember-data-types/tracking" from your project in both your package.json and tsconfig.json`
        : false,
      hasWarpDriveEmber ? false : `- add "@warp-drive/ember" to your project in your package.json (and run install)`,
      '- add the following import to your app.js file:',
      '',
      '\t```',
      `\timport '@warp-drive/ember/install';`,
      '\t```',
      ``,
      '- mark this deprecation as resolved in your project by adding the following to your WarpDrive config in ember-cli-build.js:',
      '',
      '\t```',
      '\tconst { setConfig } = await import("@warp-drive/build-config");',
      '\tsetConfig(app, __dirname, {',
      '\t  deprecations: {',
      '\t    DEPRECATE_TRACKING_PACKAGE: false,',
      '\t  },',
      '\t});',
      '\t```',
      ``,
      `For more information, see the Package Unification RFC: https://rfcs.emberjs.com/id/1075-warp-drive-package-unification/`,
    ]
      .filter((l) => l !== false)
      .join('\n');

    deprecate(message, false, {
      id: 'warp-drive.deprecate-tracking-package',
      until: '6.0.0',
      for: 'warp-drive',
      since: {
        enabled: '5.3.4',
        available: '4.13',
      },
      url: 'https://deprecations.emberjs.com/id/warp-drive.deprecate-tracking-package',
    });
  }
}
