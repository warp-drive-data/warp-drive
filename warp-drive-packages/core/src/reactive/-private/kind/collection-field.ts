import { assert } from '@warp-drive/build-config/macros';

import { entangleSignal } from '../../../signals/-private';
import type { CollectionField } from '../../../types/schema/fields';
import type { KindContext } from '../default-mode';
import { createRelationshipDocument, type ReactiveRelationshipDocument } from '../fields/relationship-document.ts';

export function getCollectionField(context: KindContext<CollectionField>): unknown {
  const signal = entangleSignal(context.signals, context.record, context.path.at(-1)!, null);
  const cached = signal.value as ReactiveRelationshipDocument<unknown> | null;
  if (cached) {
    return cached;
  }

  const doc = createRelationshipDocument({
    store: context.store,
    resourceKey: context.resourceKey,
    path: context.path,
    field: context.field,
    editable: context.editable,
  });
  signal.value = doc;
  return doc;
}

export function setCollectionField(context: KindContext<CollectionField>): boolean {
  assert(
    `Cannot set ${context.resourceKey.type}.${context.field.name} directly. Mutate or set \`data\` on the relationship document instead: \`record.${context.field.name}.data = [...]\``
  );
  return false;
}
