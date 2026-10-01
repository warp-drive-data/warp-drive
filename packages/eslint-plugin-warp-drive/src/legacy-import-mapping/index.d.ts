/** Where an imported name lives in the map's `to` release. */
export interface Target {
  module: string;
  export: string;
}
/**
 * What a consumer does with one imported name.
 *
 * - `rewrite`: import `to.export` from `to.module` instead.
 * - `report`: leave the import as written and tell the user. `removed` means nothing in the `to`
 *   release stands in for the name. `untracked` means the from-release module is known but the
 *   map has no entry for the name and no module-level move to carry it. `legacy` means the name
 *   still lives only in a legacy package. `type-only` means a value import names something that
 *   was a value in the from release and is only a type in the `to` release.
 * - `keep`: say nothing. The name did not move, or the module is not one the map knows.
 */
export type Decision =
  | { action: 'rewrite'; to: Target }
  | { action: 'report'; reason: 'removed' | 'untracked' | 'legacy' | 'type-only' }
  | { action: 'keep' };
export interface ExportMap {
  readonly from: string;
  readonly to: string;
  /**
   * `name` is a binding name, `"default"`, or `"*"` for a namespace import. `typeOnly` is true
   * for an `import type` declaration or an inline `type` specifier.
   */
  resolve(module: string, name: string, importKind: { typeOnly: boolean }): Decision;
}
/** From-releases this plugin ships a map for, oldest first. */
export function listFromVersions(): string[];
/**
 * The map from `from` to this plugin's own release. Defaults to the oldest shipped release.
 * Throws, naming the shipped versions, when `from` is not one of them.
 */
export function loadMap(from?: string): ExportMap;
