/**
 * A live array of the records of one type.
 */
export class IdentifierArray<T = unknown> {
  declare type: string;
  declare records: T[];
  length = 0;

  constructor(options: { type: string; identifiers: string[] }) {
    this.type = options.type;
    this.length = options.identifiers.length;
  }
}
