export interface Options {
  verbose: boolean;
}
export type Mode = 'a' | 'b';
export class Thing {
  mode: Mode = 'a';
}
export function configure(options: Options): void {
  void options;
}
