/**
 * @deprecated use cacheFor
 */
export function recordIdentifierFor(record: object): string {
  return String(record);
}

export function cacheFor(record: object): object {
  return record;
}
