import type { Store } from '../../../index.ts';
import { fastPush } from '../../../store/-private.ts';
import type { ReactiveResourceArray } from '../../../store/-private/record-arrays/resource-array.ts';
import type { CollectionRelationship } from '../../../types/cache/relationship.ts';
import type { LocalRelationshipOperation } from '../../../types/graph.ts';
import type { ResourceKey } from '../../../types/identifier.ts';
import type { CollectionField, ResourceField } from '../../../types/schema/fields.ts';
import { Context } from '../symbols.ts';

/**
 * `resource` and `collection` relationships require every resource referenced
 * in their `data` to have been included in the payload that referenced it.
 * Materializing a member that was never loaded is therefore an error rather
 * than an empty record.
 *
 * @private
 */
export function assertRelatedIsLoaded(
  store: Store,
  resourceKey: ResourceKey,
  field: ResourceField | CollectionField,
  related: ResourceKey
): void {
  if (!store._instanceCache.recordIsLoaded(related)) {
    throw new Error(
      `Cannot materialize the ${field.kind} relationship ${resourceKey.type}.${field.name} on '${resourceKey.type}:${String(resourceKey.id)}': the related resource '${related.type}:${String(related.id)}' has no data in the cache. Every resource referenced in the data of a resource or collection relationship must be included in the payload that references it.`
    );
  }
}

/**
 * The manager for the reactive array backing a `collection` relationship
 * document's `data`.
 *
 * The editable copy renders reconciled local state; the readonly copy
 * renders remote state (mirroring `ManyArrayManager` for linksMode hasMany).
 *
 * @private
 */
export class RelatedCollectionManager {
  declare store: Store;
  declare resourceKey: ResourceKey;
  declare field: CollectionField;
  declare key: string;
  declare editable: boolean;

  constructor(store: Store, resourceKey: ResourceKey, field: CollectionField, key: string, editable: boolean) {
    this.store = store;
    this.resourceKey = resourceKey;
    this.field = field;
    this.key = key;
    this.editable = editable;
  }

  _syncArray(array: ReactiveResourceArray): void {
    const method = this.editable ? 'getRelationship' : 'getRemoteRelationship';
    const rawValue = this.store.cache[method](this.resourceKey, this.key) as CollectionRelationship;
    const currentState = array[Context].source;

    // rawValue.data is undefined when the relationship has never received membership
    // data (e.g. a links-only payload) - there is nothing to sync in that case.
    if (rawValue.data !== undefined && currentState !== rawValue.data) {
      for (let i = 0; i < rawValue.data.length; i++) {
        assertRelatedIsLoaded(this.store, this.resourceKey, this.field, rawValue.data[i]);
      }
      currentState.length = 0;
      fastPush(currentState, rawValue.data);
    }
  }

  mutate(mutation: LocalRelationshipOperation): void {
    this.store.cache.mutate(mutation);
  }
}
