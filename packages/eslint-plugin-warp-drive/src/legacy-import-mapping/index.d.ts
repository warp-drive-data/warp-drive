export interface Token {
  module: string;
  export: string;
  typeOnly: boolean;
}
export interface Hop {
  at: string;
  to: Token | null;
  note?: string;
}
export type Relocation =
  | { outcome: 'moved'; to: Token; note?: string; hops?: Hop[] }
  | { outcome: 'unchanged'; to: Token }
  | { outcome: 'legacy'; to: Token; hops?: Hop[] }
  | { outcome: 'removed'; at: string; note?: string; hops?: Hop[] };
export interface ExportMap {
  readonly from: string;
  readonly to: string;
  lookup(module: string, name: string): Relocation | null;
  moduleMove(module: string): Token | null;
  knows(module: string): boolean;
}
export function listFromVersions(): string[];
export function loadMap(from?: string): ExportMap;
