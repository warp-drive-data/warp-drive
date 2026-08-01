import type { LOG_CONFIG } from '@warp-drive/build-config/-private/utils/logging';

import { getOrSetUniversal } from './-private.ts';

const RuntimeConfig: { debug: Partial<LOG_CONFIG>; mirage?: boolean } = getOrSetUniversal('WarpDriveRuntimeConfig', {
  debug: {},
});

function trySessionStorage() {
  // This works even when sessionStorage is not available.
  // See https://github.com/warp-drive-data/warp-drive/issues/9784
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

const storage = trySessionStorage();
const settings = storage?.getItem('WarpDriveRuntimeConfig');
if (settings) {
  Object.assign(RuntimeConfig, JSON.parse(settings));
}

export function getRuntimeConfig(): typeof RuntimeConfig {
  return RuntimeConfig;
}

/**
 * Upserts the specified logging configuration into the runtime
 * config.
 *
 * globalThis.setWarpDriveLogging({ LOG_CACHE: true } });
 *
 */
export function setLogging(config: Partial<LOG_CONFIG>): void {
  Object.assign(RuntimeConfig.debug, config);
  storage?.setItem('WarpDriveRuntimeConfig', JSON.stringify(RuntimeConfig));
}

/**
 * Explicitly declares whether requests may be served by Mirage (or another
 * Pretender-based fetch mock) instead of a native `fetch` implementation.
 *
 * The `Fetch` request handler otherwise infers this via a heuristic (the
 * presence of `window.server.pretender`, or `window.fetch` appearing to be
 * patched), which can be wrong in either direction: some Mirage setups don't
 * expose `window.server`, while some unrelated tools (APM agents, browser
 * extensions) also patch `fetch`. Call this to override that heuristic:
 * `true` to force Mirage-compatible behavior on, `false` to force it off.
 *
 * globalThis.setWarpDriveIsMaybeMirage(true);
 *
 */
export function setIsMaybeMirage(value: boolean): void {
  RuntimeConfig.mirage = value;
  storage?.setItem('WarpDriveRuntimeConfig', JSON.stringify(RuntimeConfig));
}
