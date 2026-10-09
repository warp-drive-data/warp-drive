import { recordIdentifierFor } from '@warp-drive/core';
import type { Store } from '@warp-drive/core';
import type { GraphqlVariables } from '@warp-drive/core/types/graphql-request';

import { fieldKey, parseFieldKey } from './field-arguments';

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
 *
 * @summary Reads the value of a GraphQL field that was fetched with arguments from the cache.
 * @public
 * @since 5.10.0
 * @param store - the store the record belongs to
 * @param record - the record the field belongs to
 * @param name - the name of the field
 * @param args - the arguments the field was fetched with
 * @return the record or records for a resource field, the raw value otherwise, or `undefined` when it was not fetched
 */
export function readField(store: Store, record: object, name: string, args: GraphqlVariables = {}): unknown {
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

export interface FieldListOptions {
  /**
   * Which of the values of the field to update, by the arguments they were fetched with. All of
   * them are updated when it is not given.
   */
  where?: (args: GraphqlVariables) => boolean;
  /**
   * The position to add at. The record is added at the end when it is not given.
   */
  index?: number;
}

function updateField(
  store: Store,
  record: object,
  name: string,
  item: object,
  options: FieldListOptions,
  op: 'add' | 'remove'
): void {
  const identifier = recordIdentifierFor(record);
  const itemKey = recordIdentifierFor(item);
  if (itemKey.id === null) {
    throw new Error(`Cannot update a list with a record that has no id. Save ${itemKey.type} first.`);
  }

  const attributes = (store.cache.peek(identifier) as { attributes?: Record<string, unknown> } | null)?.attributes;
  if (!attributes) {
    return;
  }

  for (const [key, value] of Object.entries(attributes)) {
    const parsed = parseFieldKey(key);
    // only the lists of resources of this field, and, when asked, the ones for these arguments
    if (parsed?.name !== name || (options.where && !options.where(parsed.args))) {
      continue;
    }
    if (!isObject(value) || !Array.isArray(value.$refs)) {
      continue;
    }

    const refs = value.$refs as Array<{ type: string; id: string }>;
    const at = refs.findIndex((ref) => ref.type === itemKey.type && ref.id === itemKey.id);
    let next: typeof refs | null = null;

    if (op === 'add' && at === -1) {
      next = [...refs];
      next.splice(options.index ?? next.length, 0, { type: itemKey.type, id: itemKey.id });
    } else if (op === 'remove' && at !== -1) {
      next = refs.filter((_, position) => position !== at);
    }

    if (next) {
      store.cache.upsert(
        identifier,
        { type: identifier.type, id: identifier.id, attributes: { [key]: { $refs: next } } },
        true
      );
    }
  }
}

/**
 * Adds a record to the lists a field has, in every value of the field that is in the cache, or in
 * the ones the `where` option picks by their arguments. Use it after a mutation created a record,
 * so the lists of the parent that should show it do.
 *
 * ```ts
 * import { addToField } from '@warp-drive/utilities/graphql';
 *
 * // the new member joined in January, so it belongs to the list of that range
 * addToField(store, project, 'memberList', member, { where: ({ from }) => from === '2026-01-01' });
 * ```
 *
 * A record that is already in a list is not added again.
 *
 * @summary Adds a record to the lists of a GraphQL field with arguments, after a mutation.
 * @public
 * @since 5.10.0
 * @param store - the store the record belongs to
 * @param record - the record the field belongs to
 * @param name - the name of the field
 * @param item - the record to add
 * @param options - `where` picks the values to update by their arguments, `index` the position
 */
export function addToField(
  store: Store,
  record: object,
  name: string,
  item: object,
  options: FieldListOptions = {}
): void {
  updateField(store, record, name, item, options, 'add');
}

/**
 * Removes a record from the lists a field has. It is the opposite of {@link addToField}, and takes the
 * same `where` option.
 *
 * @summary Removes a record from the lists of a GraphQL field with arguments, after a mutation.
 * @public
 * @since 5.10.0
 * @param store - the store the record belongs to
 * @param record - the record the field belongs to
 * @param name - the name of the field
 * @param item - the record to remove
 * @param options - `where` picks the values to update by their arguments
 */
export function removeFromField(
  store: Store,
  record: object,
  name: string,
  item: object,
  options: Omit<FieldListOptions, 'index'> = {}
): void {
  updateField(store, record, name, item, options, 'remove');
}
