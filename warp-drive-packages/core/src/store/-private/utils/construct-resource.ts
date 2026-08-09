import { assert } from '@warp-drive/core/build-config/macros';

import type { ExistingResourceIdentifierObject, ResourceIdentifierObject } from '../../../types/spec/json-api-raw.ts';
import { isResourceKey } from '../managers/cache-key-manager.ts';
import { coerceId } from './coerce-id.ts';
import { isNonEmptyString } from './is-non-empty-string.ts';

/**
 * Given an existing resource identifier object (or a {@link ResourceKey}),
 * returns it unchanged aside from coercing its `id`, if present, to a string.
 *
 * @private
 */
export function constructResource(type: ResourceIdentifierObject): ResourceIdentifierObject;
/**
 * Builds a resource identifier from a `type`, `id`, and `lid`, all of which
 * are known to be present, producing an {@link ExistingResourceIdentifierObject}.
 *
 * @private
 */
export function constructResource(type: string, id: string, lid: string): ExistingResourceIdentifierObject;
/**
 * Builds a resource identifier from a `lid` alone, for the case where `type`
 * and `id` are not (yet) known.
 *
 * @private
 */
export function constructResource(
  type: string | undefined,
  id: null | undefined,
  lid: string
): ExistingResourceIdentifierObject;
/**
 * Builds a resource identifier from a `type` and `id`, with an optional `lid`,
 * producing an {@link ExistingResourceIdentifierObject}.
 *
 * @private
 */
export function constructResource(type: string, id: string, lid?: string | null): ExistingResourceIdentifierObject;
/**
 * Builds a resource identifier from a `type` and an optional `id`/`lid`. If no
 * usable `id` is provided, falls back to constructing a `lid`-only identifier.
 *
 * @private
 */
export function constructResource(
  type: string,
  id?: string | number | null,
  lid?: string | null
): ResourceIdentifierObject;
/**
 * Implementation for {@link constructResource}. Normalizes the supplied
 * `type`/`id`/`lid` (or existing resource identifier object) into a valid
 * {@link ResourceIdentifierObject}, coercing the id and asserting that enough
 * information was provided to identify the resource.
 *
 * @private
 */
export function constructResource(
  type: string | ResourceIdentifierObject | undefined,
  id?: string | number | null,
  lid?: string | null
): ResourceIdentifierObject | ExistingResourceIdentifierObject {
  if (typeof type === 'object' && type !== null) {
    const resource = type;
    if (isResourceKey(resource)) {
      return resource;
    }
    if ('id' in resource) {
      resource.id = coerceId(resource.id);
    }

    assert(
      'Expected either id or lid to be a valid string',
      ('id' in resource && isNonEmptyString(resource.id)) || isNonEmptyString(resource.lid)
    );
    assert('if id is present, the type must be a string', !('id' in resource) || typeof resource.type === 'string');

    return resource;
  } else {
    const trueId = coerceId(id);
    if (!isNonEmptyString(trueId)) {
      if (isNonEmptyString(lid)) {
        return { lid };
      }
      throw new Error('Expected either id or lid to be a valid string');
    }

    assert('type must be a string', typeof type === 'string');

    if (isNonEmptyString(lid)) {
      return { type, id: trueId, lid };
    }

    return { type, id: trueId };
  }
}
