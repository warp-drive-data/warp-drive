export interface Token {
  module: string;
  export: string;
  typeOnly: boolean;
}
export type Relocation =
  | { outcome: 'moved'; to: Token }
  | { outcome: 'unchanged'; to: Token }
  | { outcome: 'legacy'; to: Token }
  | { outcome: 'removed' };
export interface ExportMap {
  readonly from: string;
  readonly to: string;
  lookup(module: string, name: string): Relocation | null;
  moduleMove(module: string): Token | null;
  knows(module: string): boolean;
}
export function listFromVersions(): string[];
export function loadMap(from?: string): ExportMap;
