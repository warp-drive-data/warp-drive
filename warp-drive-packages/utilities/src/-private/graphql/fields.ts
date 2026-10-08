import { recordIdentifierFor } from '@warp-drive/core';
import type { Store } from '@warp-drive/core';
import type { GraphqlVariables } from '@warp-drive/core/types/graphql-request';

import { fieldKey } from './field-arguments';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Reads the value a record has for a field that was asked for with arguments, such as
 * `memberList(from: "2026-01-01", to: "2026-01-31")`.
 *
 * A field with arguments has a value for each combination of arguments, so it is not a field of the
 * record that can be read with `record.memberList`: that would show whichever was fetched last.
 * Pass the same arguments the query was made with.
 *
 * - a list of resources gives an array of the records that are in the store, in the order of the response
 * - a single resource gives its record, or `null`
 * - anything else gives the value as the response had it
 * - `undefined` means no query has fetched the field with these arguments
 *
 * ```ts
 * import { readField } from '@warp-drive/utilities/graphql';
 *
 * const members = readField(store, project, 'memberList', { from, to });
 * ```
 *
 * The value is read when it is called: it does not update the template by itself when another
 * request changes it, so read it where the request that fetched it is rendered.
 */
export function readField(
  store: Store,
  record: object,
  name: string,
  args: GraphqlVariables = {}
): unknown {
  const value = store.cache.getAttr(recordIdentifierFor(record), fieldKey(name, args));

  if (isObject(value) && Array.isArray(value.$refs)) {
    return (value.$refs as Array<{ type: string; id: string }>)
      .map((ref) => store.peekRecord(ref.type, ref.id))
      .filter((related) => related !== null);
  }

  if (isObject(value) && '$ref' in value) {
    const ref = value.$ref as { type: string; id: string } | null;
    return ref ? store.peekRecord(ref.type, ref.id) : null;
  }

  return value;
}
