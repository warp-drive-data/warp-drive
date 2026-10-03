/** An export of a module: `export` is the exported name, `default` included, or `*` for the whole module. */
export interface Target {
  module: string;
  export: string;
}

/** A page a report points to, from the shipped `messages.json`. */
export interface Link {
  title: string;
  url: string;
}

/**
 * What to do with one imported name so that the import works against the map's `to` release.
 *
 * - `rewrite`: import `to.export` from `to.module` instead. `reason: 'private-target'` means
 *   `to.module` is private (a path segment starts with `-`).
 * - `report`: leave the import as written and tell the user why.
 *   - `removed`: nothing in `to` continues the export. `removedIn` and `shim` come from a judged
 *     decision when one exists: where it was removed, and the smallest code that restores it.
 *   - `untracked`: the module did not export the name in the `from` release.
 *   - `type-only`: a value import of a value that is only a type in `to`; `to` names that type.
 *   - `side-effect`: the module is reported as a whole (`preferences.json`), because importing
 *     it also sets things up.
 * - `keep`: nothing to do. The module is not one the `from` release had, or the export did not
 *   move.
 */
export type Decision =
  | { action: 'rewrite'; to: Target; reason?: 'private-target' }
  | { action: 'report'; reason: 'removed'; removedIn?: string; shim?: string; links?: readonly Link[] }
  | { action: 'report'; reason: 'untracked'; links?: readonly Link[] }
  | { action: 'report'; reason: 'type-only'; to: Target; links?: readonly Link[] }
  | { action: 'report'; reason: 'side-effect'; links?: readonly Link[] }
  | { action: 'keep' };

/** An entry of `decisions/<from>.json` the map did not apply, and why. */
export interface StaleDecision {
  decl: string;
  source: Target | null;
  choice: Target | null;
  reason: 'decl-not-in-from' | 'choice-not-in-to' | 'unknown-to' | 'duplicate';
}

export interface ExportMap {
  /** The `from` release, as a full version. */
  readonly from: string;
  /** The `to` release, as a full version or `head`. */
  readonly to: string;
  /** Judged decisions for `from` that could not be applied. */
  readonly stale: readonly StaleDecision[];
  /**
   * `name` is an export name, `"default"`, or `"*"` for a namespace or side-effect import.
   * `typeOnly` is true for an `import type` declaration or an inline `type` specifier.
   */
  resolve(module: string, name: string, options?: { typeOnly?: boolean }): Decision;
}

export interface LoadMapOptions {
  /** The release the imports were written against. Defaults to the baseline release. */
  from?: string;
  /**
   * The release to map them to. Defaults to the installed `@warp-drive/core` version's release,
   * else the newest release.
   */
  to?: string;
  /** Where the mapping data lives. Defaults to the data this plugin ships. */
  dataDir?: string;
}

/**
 * The map from `from` to `to`. Both accept a full version (`5.9.1`), a `major.minor` (`5.9`) or
 * `head`; a minor between two shipped releases means the older one. Maps are cached per
 * `(dataDir, from, to)`. Throws for a version the data does not cover, and with
 * `code === NO_DATA` when the data directory holds no mapping data.
 */
export function loadMap(options?: LoadMapOptions): ExportMap;

/** The versions a map can name, oldest first, ending with `head` when the data reaches it. */
export function listReleases(options?: { dataDir?: string }): string[];

/** The `code` of the error `loadMap` throws for a data directory without mapping data. */
export const NO_DATA: 'ERR_WARP_DRIVE_NO_IMPORT_MAPPING_DATA';

/** The version `head` stands for: this plugin's own version. */
export const HEAD_VERSION: string;
