import { assert } from '@warp-drive/core/build-config/macros';

import type { ExtensionDef } from '../../../reactive.ts';
import { Context } from '../../../reactive/-private.ts';
import { notifyInternalSignal, type WarpDriveSignal } from '../../../signals/-private.ts';
import type { LocalRelationshipOperation } from '../../../types/graph.ts';
import type { ResourceKey } from '../../../types/identifier.ts';
import type { OpaqueRecordInstance } from '../../../types/record.ts';
import type { CollectionField } from '../../../types/schema/fields.ts';
import { recordIdentifierFor } from '../caches/instance-cache.ts';
import { isResourceKey } from '../managers/cache-key-manager.ts';
import type { Store } from '../store-service.ts';
import type { MinimumManager } from './-utils.ts';
import type { NativeProxy } from './native-proxy-type-fix.ts';
import { createReactiveResourceArray, destroy, type ReactiveResourceArray } from './resource-array.ts';

/**
 * The private bookkeeping a related collection carries in its
 * {@link Context}: the resource that owns the relationship, the cache
 * path to the field (the last segment being the field's cache key), and
 * the field schema.
 *
 * @private
 */
export interface RelatedCollectionOptions {
  [key: string]: unknown;
  resourceKey: ResourceKey;
  path: string[];
  field: CollectionField;
}

/**
 * @private
 */
export interface ReactiveRelatedCollectionCreateArgs {
  store: Store;
  manager: MinimumManager;
  source: ResourceKey[];
  options: RelatedCollectionOptions;
  editable: boolean;
  extensions: Map<string | symbol, ExtensionDef> | null;
}

/**
 * Creates the reactive array backing the `data` of a `collection`
 * relationship's document.
 *
 * When `editable`, array mutation methods (`push`, `splice`, ...) are
 * translated into cache mutations against the owning resource's
 * relationship; otherwise every mutation asserts.
 *
 * @private
 */
export function createRelatedCollection<T>(config: ReactiveRelatedCollectionCreateArgs): ReactiveResourceArray<T> {
  return createReactiveResourceArray<T>({
    store: config.store,
    manager: config.manager,
    editable: config.editable,
    source: config.source,
    data: null,
    features: null,
    extensions: config.extensions,
    options: config.options,
    destroy: destroyRelatedCollection,
    mutate: config.editable ? _MUTATE : null,
  });
}

function destroyRelatedCollection(this: ReactiveResourceArray): void {
  destroy.call(this, false);
}

function getOptions(collection: ReactiveResourceArray): RelatedCollectionOptions {
  const options = collection[Context].options as RelatedCollectionOptions | null;
  assert(`Expected a related collection to know its owner`, options && options.resourceKey && options.path);
  return options;
}

function _MUTATE<T>(
  target: ResourceKey[],
  receiver: typeof NativeProxy<ResourceKey[], T[]>,
  prop: string,
  args: unknown[],
  _SIGNAL: WarpDriveSignal
): unknown {
  const collection = receiver as unknown as ReactiveResourceArray<T>;
  switch (prop) {
    case 'length 0': {
      Reflect.set(target, 'length', 0);
      mutateReplaceRelatedRecords(collection, [], _SIGNAL);
      return true;
    }
    case 'replace cell': {
      // `arr[index] = record` is expressed as a remove + add at the same
      // index, since `replaceRelatedRecord` is a resource-relationship op.
      const [index, prior, value] = args as [number, ResourceKey, ResourceKey];
      assertNoDuplicates(
        collection,
        target,
        (state) => (state[index] = value),
        `Cannot replace a member of a collection relationship with a record that is already a member.`
      );
      target[index] = value;
      mutate(
        collection,
        { op: 'remove', record: getOptions(collection).resourceKey, field: fieldKey(collection), value: prior, index },
        _SIGNAL
      );
      mutate(
        collection,
        { op: 'add', record: getOptions(collection).resourceKey, field: fieldKey(collection), value, index },
        _SIGNAL
      );
      return true;
    }
    case 'push': {
      const newValues = extractIdentifiersFromRecords(args);
      assertNoDuplicates(
        collection,
        target,
        (state) => state.push(...newValues),
        `Cannot push duplicates to a collection relationship.`
      );
      // array functions must run through Reflect to work properly
      // oxlint-disable-next-line typescript/unbound-method
      const result: unknown = Reflect.apply(target[prop], receiver, args);
      if (newValues.length) {
        mutateAddToRelatedRecords(collection, { value: newValues }, _SIGNAL);
      }
      return result;
    }
    case 'pop': {
      // oxlint-disable-next-line typescript/unbound-method
      const result: unknown = Reflect.apply(target[prop], receiver, args);
      if (result) {
        mutateRemoveFromRelatedRecords(
          collection,
          { value: recordIdentifierFor(result as OpaqueRecordInstance) },
          _SIGNAL
        );
      }
      return result;
    }
    case 'unshift': {
      const newValues = extractIdentifiersFromRecords(args);
      assertNoDuplicates(
        collection,
        target,
        (state) => state.unshift(...newValues),
        `Cannot unshift duplicates to a collection relationship.`
      );
      // oxlint-disable-next-line typescript/unbound-method
      const result: unknown = Reflect.apply(target[prop], receiver, args);
      if (newValues.length) {
        mutateAddToRelatedRecords(collection, { value: newValues, index: 0 }, _SIGNAL);
      }
      return result;
    }
    case 'shift': {
      // oxlint-disable-next-line typescript/unbound-method
      const result: unknown = Reflect.apply(target[prop], receiver, args);
      if (result) {
        mutateRemoveFromRelatedRecords(
          collection,
          { value: recordIdentifierFor(result as OpaqueRecordInstance), index: 0 },
          _SIGNAL
        );
      }
      return result;
    }
    case 'sort': {
      // oxlint-disable-next-line typescript/unbound-method
      const result: unknown = Reflect.apply(target[prop], receiver, args);
      // a local reorder is expressed as a full replace: the graph diffs the
      // new order against its current state and preserves the ordering.
      mutateReplaceRelatedRecords(collection, target.slice(), _SIGNAL);
      return result;
    }
    case 'splice': {
      const [start, _deleteCount, ...adds] = args as [number, number | undefined, ...OpaqueRecordInstance[]];

      let deleteCount: number;
      if (args.length === 1) {
        // Omitting deleteCount: remove ALL elements from start
        deleteCount = Infinity;
      } else if (typeof _deleteCount !== 'number' || _deleteCount < 0) {
        deleteCount = 0;
      } else {
        deleteCount = _deleteCount;
      }
      // sanitize deleteCount to not exceed the number of items from start to end
      deleteCount = Math.min(collection[Context].source.length - start, deleteCount);

      const newValues = extractIdentifiersFromRecords(adds);

      // detect a full replace
      if (start === 0 && deleteCount === collection[Context].source.length) {
        assertNoDuplicates(
          collection,
          target,
          (state) => state.splice(start, deleteCount, ...newValues),
          `Cannot replace a collection relationship's state with a new state that contains duplicates.`
        );
        // oxlint-disable-next-line typescript/unbound-method
        const result = Reflect.apply(target[prop], receiver, args) as OpaqueRecordInstance[];
        mutateReplaceRelatedRecords(collection, newValues, _SIGNAL);
        return result;
      }

      assertNoDuplicates(
        collection,
        target,
        (state) => state.splice(start, deleteCount, ...newValues),
        `Cannot splice a collection relationship's state with a new state that contains duplicates.`
      );
      // oxlint-disable-next-line typescript/unbound-method
      const result = Reflect.apply(target[prop], receiver, args) as OpaqueRecordInstance[];
      if (deleteCount > 0) {
        mutateRemoveFromRelatedRecords(collection, { value: result.map(recordIdentifierFor), index: start }, _SIGNAL);
      }
      if (newValues.length > 0) {
        mutateAddToRelatedRecords(collection, { value: newValues, index: start }, _SIGNAL);
      }
      return result;
    }
    default:
      assert(`unable to convert ${prop} into a transaction that updates the cache state for this collection`);
  }
}

function fieldKey(collection: ReactiveResourceArray): string {
  const { path } = getOptions(collection);
  return path[path.length - 1];
}

function extractIdentifiersFromRecords(records: OpaqueRecordInstance[]): ResourceKey[] {
  return records.map(extractIdentifierFromRecord);
}

function extractIdentifierFromRecord(record: OpaqueRecordInstance): ResourceKey {
  assert(
    `All elements of a collection relationship must be resources, you passed ${typeof record}`,
    (function () {
      try {
        recordIdentifierFor(record);
        return true;
      } catch {
        return false;
      }
    })()
  );
  return recordIdentifierFor(record);
}

function assertNoDuplicates(
  collection: ReactiveResourceArray,
  target: ResourceKey[],
  callback: (currentState: ResourceKey[]) => void,
  reason: string
) {
  const state = target.slice();
  callback(state);

  if (state.length !== new Set(state).size) {
    const { resourceKey } = getOptions(collection);
    const duplicates = state.filter((currentValue, currentIndex) => state.indexOf(currentValue) !== currentIndex);

    throw new Error(
      `${reason} Found duplicates for the following records within the new state provided to \`<${
        resourceKey.type
      }:${resourceKey.id || resourceKey.lid}>.${fieldKey(collection)}\`\n\t- ${Array.from(new Set(duplicates))
        .map((r) => (isResourceKey(r) ? r.lid : recordIdentifierFor(r).lid))
        .sort((a, b) => a.localeCompare(b))
        .join('\n\t- ')}`
    );
  }
}

function mutateAddToRelatedRecords(
  collection: ReactiveResourceArray,
  operationInfo: { value: ResourceKey | ResourceKey[]; index?: number },
  _SIGNAL: WarpDriveSignal
) {
  mutate(
    collection,
    {
      op: 'add',
      record: getOptions(collection).resourceKey,
      field: fieldKey(collection),
      ...operationInfo,
    },
    _SIGNAL
  );
}

function mutateRemoveFromRelatedRecords(
  collection: ReactiveResourceArray,
  operationInfo: { value: ResourceKey | ResourceKey[]; index?: number },
  _SIGNAL: WarpDriveSignal
) {
  mutate(
    collection,
    {
      op: 'remove',
      record: getOptions(collection).resourceKey,
      field: fieldKey(collection),
      ...operationInfo,
    },
    _SIGNAL
  );
}

function mutateReplaceRelatedRecords(
  collection: ReactiveResourceArray,
  value: ResourceKey[],
  _SIGNAL: WarpDriveSignal
) {
  mutate(
    collection,
    {
      op: 'replaceRelatedRecords',
      record: getOptions(collection).resourceKey,
      field: fieldKey(collection),
      value,
    },
    _SIGNAL
  );
}

function mutate(collection: ReactiveResourceArray, mutation: LocalRelationshipOperation, _SIGNAL: WarpDriveSignal) {
  const { manager } = collection[Context];
  assert(`Expected the manager for a related collection to implement mutate`, typeof manager.mutate === 'function');
  manager.mutate(mutation);
  notifyInternalSignal(_SIGNAL);
}
