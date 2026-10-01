/**
 * @deprecated use dasherize from @ember-data/request-utils/string
 */
export function normalizeModelName(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function peekRecords(type: string): unknown[];
export function peekRecords(type: string, ids: string[]): unknown[];
export function peekRecords(type: string, ids?: string[]): unknown[] {
  return ids ? ids.map((id) => ({ type, id })) : [];
}
