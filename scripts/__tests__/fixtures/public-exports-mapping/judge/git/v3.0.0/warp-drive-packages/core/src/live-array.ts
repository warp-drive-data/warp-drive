/**
 * A reactive array of the resources of one type.
 */
export class LiveArray<T = unknown> {
  declare readonly type: string;
  declare records: T[];
  length = 0;

  constructor(options: { type: string; identifiers: string[] }) {
    this.type = options.type;
    this.length = options.identifiers.length;
  }
}

export function createLiveArray<T>(options: { type: string; identifiers: string[] }): LiveArray<T> {
  return new LiveArray<T>(options);
}
