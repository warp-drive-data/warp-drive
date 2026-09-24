import { assert } from '@warp-drive/build-config/macros';

import { entangleSignal } from '../../../signals/-private';
import { fieldValueIdentity } from '../../../store/-private/managers/cache-key-manager.ts';
import type { ObjectValue, Value } from '../../../types/json/raw';
import type { SchemaObjectField } from '../../../types/schema/fields';
import type { KindContext } from '../default-mode';
import { ManagedObjectMap } from '../fields/managed-object';
import { ReactiveResource } from '../record';
import { Destroy } from '../symbols';

type MemoizedSchemaObject = {
  type: string;
  identity: string | object;
  value: ReactiveResource;
};

export function getSchemaObjectField(context: KindContext<SchemaObjectField>): unknown {
  const signal = entangleSignal(context.signals, context.record, context.path.at(-1)!, null);
  const { store, resourceKey, path, field } = context;
  const { cache } = store;
  let rawValue = (
    context.editable ? cache.getAttr(resourceKey, path) : cache.getRemoteAttr(resourceKey, path)
  ) as object;

  if (!rawValue && !field.options?.polymorphic && field.options?.defaultValue) {
    rawValue = {};
  }

  if (!rawValue) {
    if (signal.value) {
      const value = signal.value as MemoizedSchemaObject;
      // TODO if we had idle scheduling this should be done there.
      void Promise.resolve().then(() => {
        value.value[Destroy]();
      });
      signal.value = null;
    }
    return null;
  }

  const resolved = fieldValueIdentity(store.schema, field, rawValue);
  assert(`Expected a schema-object value to resolve to a schema-object identity`, resolved !== null);
  const { type: objectType, hash } = resolved;
  const identity = hash ?? field.name;

  const cachedSchemaObject = signal.value as MemoizedSchemaObject | null;
  if (cachedSchemaObject) {
    if (cachedSchemaObject.type === objectType && cachedSchemaObject.identity === identity) {
      return cachedSchemaObject.value;
    } else {
      // TODO if we had idle scheduling this should be done there.
      void Promise.resolve().then(() => {
        cachedSchemaObject.value[Destroy]();
      });
    }
  }

  const schemaObject = new ReactiveResource({
    store: context.store,
    resourceKey: context.resourceKey,
    modeName: context.modeName,
    legacy: context.legacy,
    editable: context.editable,
    path: context.path,
    field: context.field,
    value: objectType,
  });

  signal.value = {
    type: objectType,
    identity: identity,
    value: schemaObject,
  };
  return schemaObject;
}

export function setSchemaObjectField(context: KindContext<SchemaObjectField>): boolean {
  const { store, value } = context;
  let newValue = value as Value;
  if (value !== null) {
    assert(`Expected value to be an object`, typeof value === 'object');
    newValue = { ...(value as ObjectValue) };
    // FIXME the case of field.type to string here is likely incorrect
    const schemaFields = store.schema.fields({ type: context.field.type as string });
    for (const key of Object.keys(newValue)) {
      if (!schemaFields.has(key)) {
        assert(`Field ${key} does not exist on schema object ${context.field.type}`);
        return false;
      }
    }
  } else {
    ManagedObjectMap.delete(context.record);
  }
  store.cache.setAttr(context.resourceKey, context.path, newValue);
  // const peeked = peekManagedObject(self, field);
  // if (peeked) {
  //   const objSignal = peeked[OBJECT_SIGNAL];
  //   objSignal.isStale = true;
  // }
  return true;
}
