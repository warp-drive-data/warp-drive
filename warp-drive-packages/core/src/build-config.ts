/**
 * This module provides a build-plugin that enables configuration of deprecations,
 * optional features, development/testing support and debug logging.
 *
 * Available settings include:
 *
 * - {@link LOGGING | debugging}
 * - {@link DEPRECATIONS | deprecations}
 * - {@link FEATURES | features}
 * - {@link WarpDriveConfig.polyfillUUID | polyfillUUID}
 * - {@link WarpDriveConfig.includeDataAdapterInProduction | includeDataAdapterInProduction}
 * - {@link WarpDriveConfig.compatWith | compatWith}
 *
 * @summary Build-time configuration for WarpDrive: `setConfig` and its babel plugin for deprecations, features,
 * debug logging, and polyfill settings.
 * @module
 */
import type { WarpDriveConfig } from '@warp-drive/build-config';
// oxlint-disable-next-line no-unused-vars
import type * as FEATURES from '@warp-drive/core/build-config/canary-features';
// oxlint-disable-next-line no-unused-vars
import type * as LOGGING from '@warp-drive/core/build-config/debugging';
// oxlint-disable-next-line no-unused-vars
import type * as DEPRECATIONS from '@warp-drive/core/build-config/deprecations';

export { setConfig, babelPlugin } from '@warp-drive/build-config';
export type { WarpDriveConfig };
