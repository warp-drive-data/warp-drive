/**
 * This package provides a build-plugin that enables configuration of deprecations,
 * optional features, development/testing support and debug logging.
 *
 * This configuration is done using `setConfig` in `ember-cli-build`.
 *
 * ```ts [ember-cli-build.js]
 * 'use strict';
 *
 * const EmberApp = require('ember-cli/lib/broccoli/ember-app');
 *
 * module.exports = async function (defaults) {
 *   const { setConfig } = await import('@warp-drive/build-config'); // [!code focus]
 *
 *   const app = new EmberApp(defaults, {});
 *
 *   setConfig(app, __dirname, { // [!code focus:3]
 *     // settings here
 *   });
 *
 *   const { buildOnce } = await import('@embroider/vite');
 *   const { compatBuild } = await import('@embroider/compat');
 *
 *   return compatBuild(app, buildOnce);
 * };
 *
 * ```
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
 * @module
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { getEnv } from './-private/utils/get-env.ts';
import { getDeprecations } from './-private/utils/deprecations.ts';
import { getFeatures } from './-private/utils/features.ts';
import * as LOGGING from './debugging.ts';
import type * as FEATURES from './canary-features.ts';
import type * as DEPRECATIONS from './deprecations.ts';
import type { MacrosConfig } from '@embroider/macros/src/node.js';
import { createLoggingConfig } from './-private/utils/logging.ts';
import type { PluginItem } from '@babel/core';

/**
 * The import sources treated as WarpDrive's build-time macros module.
 */
const MACRO_SOURCES = ['@warp-drive/build-config/macros', '@warp-drive/core/build-config/macros'];

/**
 * The `warpdrive` Babel plugin evaluates WarpDrive's build-time macros
 * (`macroCondition`, `getConfig`, `dependencySatisfies`, `moduleExists` and
 * `importSync` from `@warp-drive/core/build-config/macros`), stripping
 * unreachable branches from the build.
 *
 * ```ts [babel.config.mjs]
 * import { warpdrive } from '@warp-drive/core/build-config';
 *
 * export default {
 *   plugins: [
 *     warpdrive({ compatWith: '5.6' }),
 *   ],
 * };
 * ```
 *
 * @param options WarpDrive configuration options
 * @returns A single Babel plugin entry
 */
export function warpdrive(options: WarpDriveConfig): PluginItem {
  const finalizedConfig = finalizeConfig(options);
  const TransformMacros = resolveLocal('./babel-plugin-transform-macros.cjs');

  return [
    TransformMacros,
    {
      sources: MACRO_SOURCES,
      config: finalizedConfig,
      appRoot: process.cwd(),
    },
    'warpdrive',
  ];
}

/**
 * Create the Babel plugin for WarpDrive
 *
 * This configures the plugin which evaluates WarpDrive's build-time macros
 * (`macroCondition`, `getConfig`, `dependencySatisfies`, `moduleExists`,
 * `importSync` from `@warp-drive/core/build-config/macros`), stripping
 * unreachable branches from the build.
 *
 * @param options WarpDrive configuration options
 * @returns An array of Babel plugins
 */
export function babelPlugin(options: WarpDriveConfig): { gts: Function[]; js: PluginItem[] } {
  const env = getEnv(options.forceMode);

  return {
    // WarpDrive's macros are JS-only. Template macros were previously
    // provided by @embroider/macros and are no longer required.
    gts: [],
    js: [
      // babel-plugin-debug-macros is temporarily needed
      // to convert deprecation/warn calls into console.warn
      [
        resolve('babel-plugin-debug-macros'),
        {
          flags: [],

          debugTools: {
            isDebug: env.DEBUG,
            source: '@ember/debug',
            assertPredicateIndex: 1,
          },
        },
        'ember-data-specific-macros-stripping-test',
      ],
      warpdrive(options),
    ],
  };
}

function resolve(module: string): string {
  const filePath = import.meta.resolve(module);
  const file = filePath.replace('/node_modules/.vite-temp/', '/');
  if (file.startsWith('file://')) {
    return file.slice(7);
  }
  return file;
}

// resolves a sibling dist file in a way that works from both the esm
// and cjs builds of this module (`import.meta.resolve` is not available
// in the cjs build)
function resolveLocal(rel: string): string {
  const require = createRequire(import.meta.url);
  return require.resolve(rel);
}

/**
 * Lazily load `@embroider/macros` for interop with builds that configure
 * WarpDrive via an embroider MacrosConfig ({@link setConfig} with an app
 * instance). The library's own code no longer uses `@embroider/macros`,
 * so this is only needed when the classic configuration path is used.
 *
 * `@embroider/macros` is an optional peerDependency, so with strict
 * package managers it may not be resolvable from this package. Apps that
 * use the classic path always have it in their dependency graph though
 * (via `@embroider/compat` or `ember-auto-import`), so we also attempt
 * resolution from the app and through those packages.
 */
function getEmbroiderMacrosConfig(appRoot: string): typeof MacrosConfig {
  const bases = [import.meta.url, path.join(appRoot, 'package.json')];
  const carriers = [null, '@embroider/compat', 'ember-auto-import'];

  for (const base of bases) {
    for (const carrier of carriers) {
      try {
        let require = createRequire(base);
        if (carrier) {
          require = createRequire(require.resolve(carrier));
        }
        const EmbroiderMacros = require('@embroider/macros/src/node.js') as { MacrosConfig: unknown };
        return EmbroiderMacros.MacrosConfig as typeof MacrosConfig;
      } catch {
        continue;
      }
    }
  }

  throw new Error(
    `Calling setConfig with an EmberApp instance requires '@embroider/macros' to be resolvable. Either install '@embroider/macros' or configure WarpDrive using babelPlugin() from '@warp-drive/core/build-config' in your babel config.`
  );
}

/**
 * Build Configuration options for WarpDrive that
 * allow adjusting logging, deprecations, canary features
 * and optional features.
 */
export interface WarpDriveConfig {
  /**
   * An object of key/value pairs of logging flags
   *
   * see {@link LOGGING | debugging} for the available flags.
   *
   * ```ts
   * {
   *  LOG_CACHE: true,
   * }
   * ```
   *
   * @public
   */
  debug?: Partial<InternalWarpDriveConfig['debug']>;

  /**
   * If you are using the library in an environment that does not
   * support `window.crypto.randomUUID` you can enable a polyfill
   * for it.
   *
   * @public
   */
  polyfillUUID?: boolean;

  /**
   * By default, the integration required to support the ember-inspector
   * browser extension is included in production builds only when using
   * the `ember-data` package.
   *
   * Otherwise the default is to exclude it. This setting allows to explicitly
   * enable/disable it in production builds.
   *
   * @public
   */
  includeDataAdapterInProduction?: boolean;

  /**
   * The most recent version of the library from which all
   * deprecations have been resolved.
   *
   * For instance if all deprecations released prior to or
   * within `5.3` have been resolved, then setting this to
   * `5.3` will remove all the support for the deprecated
   * features for associated deprecations.
   *
   * :::caution **Universal Apps**
   * This value should be at least `5.6` for universal/non-ember
   * applications as that was the first version that builds
   * without any ember-source dependencies provided all deprecations
   * are resolved.
   * :::
   *
   * See {@link DEPRECATIONS | deprecations} for more details.
   */
  compatWith?: `${number}.${number}`;

  /**
   * An object of key/value pairs of logging flags
   *
   * see {@link DEPRECATIONS | deprecations} for the available flags.
   *
   * ```ts
   * {
   *   DEPRECATE_THING: false,
   * }
   * ```
   *
   * @public
   */
  deprecations?: Partial<InternalWarpDriveConfig['deprecations']>;

  /**
   * An object of key/value pairs of canary feature flags
   * for use when testing new features gated behind a flag
   * in a canary release version.
   *
   * see {@link FEATURES | features} for the available flags.
   *
   * ```ts
   * {
   *   FEATURE_A: true,
   * }
   * ```
   *
   * @public
   */
  features?: Partial<InternalWarpDriveConfig['features']>;

  /**
   * @private
   */
  forceMode?: 'testing' | 'production' | 'development';

  /**
   * Configuration for WarpDrive's own test infrastructure.
   * Not intended for use by applications.
   *
   * @private
   */
  tests?: {
    VERSION?: string;
    ASSERT_ALL_DEPRECATIONS?: boolean;
  };
}

interface InternalWarpDriveConfig {
  debug: typeof LOGGING;
  polyfillUUID: boolean;
  includeDataAdapter: boolean;
  compatWith: `${number}.${number}` | null;
  deprecations: ReturnType<typeof getDeprecations>;
  features: ReturnType<typeof getFeatures>;
  activeLogging: typeof LOGGING;
  env: {
    TESTING: boolean;
    PRODUCTION: boolean;
    DEBUG: boolean;
  };
  tests: {
    VERSION: string | null;
    ASSERT_ALL_DEPRECATIONS: boolean;
  };
}

function finalizeConfig(userConfig: WarpDriveConfig): InternalWarpDriveConfig {
  const debugOptions: InternalWarpDriveConfig['debug'] = Object.assign({}, LOGGING, userConfig.debug);

  const env = getEnv(userConfig.forceMode);
  const DEPRECATIONS = getDeprecations(userConfig.compatWith || null, userConfig.deprecations);
  const FEATURES = getFeatures(env.PRODUCTION);

  const includeDataAdapterInProduction =
    typeof userConfig.includeDataAdapterInProduction === 'boolean' ? userConfig.includeDataAdapterInProduction : true;
  const includeDataAdapter = env.PRODUCTION ? includeDataAdapterInProduction : true;

  return {
    debug: debugOptions,
    polyfillUUID: userConfig.polyfillUUID ?? false,
    includeDataAdapter,
    compatWith: userConfig.compatWith ?? null,
    deprecations: DEPRECATIONS,
    features: FEATURES,
    activeLogging: createLoggingConfig(env, debugOptions),
    env,
    tests: {
      VERSION: userConfig.tests?.VERSION ?? null,
      ASSERT_ALL_DEPRECATIONS: userConfig.tests?.ASSERT_ALL_DEPRECATIONS ?? false,
    },
  };
}

type MacrosWithGlobalConfig = Omit<MacrosConfig, 'globalConfig'> & { globalConfig: Record<string, unknown> };

function recastMacrosConfig(macros: object): MacrosWithGlobalConfig {
  if (!('globalConfig' in macros)) {
    throw new Error('Expected MacrosConfig to have a globalConfig property');
  }
  return macros as MacrosWithGlobalConfig;
}

/**
 * Sets the build configuration for WarpDrive that ensures
 * environment specific behaviors are activated/deactivated
 * and enables adjusting log instrumentation, removing code
 * that supports deprecated features, enabling canary features
 * and enabling/disabling optional features.
 *
 * The library uses its own babel plugin (see {@link babelPlugin}) to
 * perform this final configuration code transform. `setConfig` exists for
 * interop with builds configured through
 * [@embroider/macros](https://www.npmjs.com/package/@embroider/macros):
 * it publishes the finalized config into the embroider globalConfig
 * (so apps and addons reading `getGlobalConfig().WarpDrive` keep working)
 * and, when given an EmberApp instance, registers WarpDrive's macros
 * evaluation plugin with the app's babel options.
 *
 * This is a low level API for configuring WarpDrive. Most projects
 * should use {@link babelPlugin} instead of this function.
 *
 * ### Example
 *
 * ```ts
 * import { setConfig } from '@warp-drive/core/build-config';
 * import { buildMacros } from '@embroider/macros/babel';
 *
 * const Macros = buildMacros({
 *   configure: (config) => {
 *     setConfig(config, {
 *       compatWith: '5.6'
 *     });
 *   },
 * });
 * ```
 *
 * Note: when using this signature the WarpDrive macros evaluation plugin
 * from {@link babelPlugin} must be added to your babel plugins manually.
 */
export function setConfig(macros: object, config: WarpDriveConfig): void;
export function setConfig(context: object, appRoot: string, config: WarpDriveConfig): void;
export function setConfig(context: object, appRootOrConfig: string | WarpDriveConfig, config?: WarpDriveConfig): void {
  const isEmberClassicUsage = arguments.length === 3;
  const macros = recastMacrosConfig(
    isEmberClassicUsage
      ? getEmbroiderMacrosConfig(appRootOrConfig as string).for(context, appRootOrConfig as string)
      : context
  );

  const userConfig = isEmberClassicUsage ? config! : (appRootOrConfig as WarpDriveConfig);

  const isLegacySupport = (userConfig as unknown as { ___legacy_support?: boolean }).___legacy_support;
  const hasDeprecatedConfig = isLegacySupport && Object.keys(userConfig).length > 1;
  const hasInitiatedConfig = macros.globalConfig['WarpDrive'];

  // setConfig called by user prior to legacy support called
  if (isLegacySupport && hasInitiatedConfig) {
    if (hasDeprecatedConfig) {
      throw new Error(
        'You have provided a config object to setConfig, but are also using the legacy emberData options key in ember-cli-build. Please remove the emberData key from options.'
      );
    }
    return;
  }

  // legacy support called prior to user setConfig
  if (isLegacySupport && hasDeprecatedConfig) {
    // We don't want to print this just yet because we are going to re-arrange packages
    // and this would be come an import from @warp-drive/core. Better to not deprecate twice.
    // console.warn(
    //   `You are using the legacy emberData key in your ember-cli-build.js file. This key is deprecated and will be removed in the next major version of WarpDrive. Please use \`import { setConfig } from '@warp-drive/build-config';\` instead.`
    // );
  }

  // included hooks run during class initialization of the EmberApp instance
  // so our hook will run before the user has a chance to call setConfig
  // else we could print a useful message here
  // else if (isLegacySupport) {
  //   console.warn(
  //     `WarpDrive requires your ember-cli-build file to set a base configuration for the project.\n\nUsage:\n\t\`import { setConfig } from '@warp-drive/build-config';\n\tsetConfig(app, __dirname, {});\``
  //   );
  // }

  const finalizedConfig = finalizeConfig(userConfig);

  // Interop: continue to publish the config into the embroider MacrosConfig
  // globalConfig so that apps and addons reading
  // `getGlobalConfig().WarpDrive` from `@embroider/macros` keep working.
  macros.setGlobalConfig(import.meta.filename, 'WarpDrive', finalizedConfig);

  if (isEmberClassicUsage) {
    // Best-effort: WarpDrive's macros are no longer evaluated by
    // @embroider/macros, so ensure our evaluation plugin is added to the
    // app's babel configuration.
    const app = context as { options?: { babel?: { plugins?: unknown[] } } };
    if (app.options) {
      const babelOptions = (app.options.babel = app.options.babel || {});
      const plugins = (babelOptions.plugins = babelOptions.plugins || []);
      const TransformMacros = resolveLocal('./babel-plugin-transform-macros.cjs');
      const entry = [
        TransformMacros,
        {
          sources: MACRO_SOURCES,
          config: finalizedConfig,
          appRoot: appRootOrConfig as string,
        },
        'warpdrive',
      ];

      // setConfig may run twice for classic apps: once via the addon-shim's
      // legacy-support hook during EmberApp construction and once via the
      // app's own setConfig call. The last call wins (the legacy-support
      // hook runs first, so a user-provided config always replaces it).
      const existing = plugins.findIndex((plugin) => Array.isArray(plugin) && plugin[2] === 'warpdrive');
      if (existing === -1) {
        plugins.push(entry);
      } else {
        plugins[existing] = entry;
      }
    }
  }
}
