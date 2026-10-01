export type Field = { name: string };

/**
 * @deprecated use field
 */
export const legacyField = (name: string): Field => ({ name });

export function field(name: string): Field {
  return { name };
}
