import { assert } from '@warp-drive/build-config/macros';

import { entangleSignal } from '../../../signals/-private';
import type { ResourceField } from '../../../types/schema/fields';
import type { KindContext } from '../default-mode';
import { createRelationshipDocument, type ReactiveDocument } from '../document.ts';
import { getFieldCacheKeyStrict } from '../fields/get-field-key';

export function getResourceField(context: KindContext<ResourceField>): unknown {
  // the document is stable for the life of the record: the record's relationship notifications
  // mark its properties stale rather than replacing it
  const signal = entangleSignal(context.signals, context.record, context.path.at(-1)!, null);
  const existing = signal.value as ReactiveDocument<unknown> | null;
  if (existing) {
    return existing;
  }

  const doc = createRelationshipDocument(context.store, {
    resourceKey: context.resourceKey,
    key: getFieldCacheKeyStrict(context.field),
    editable: context.editable,
  });
  signal.value = doc;
  return doc;
}

export function setResourceField(context: KindContext<ResourceField>): boolean {
  assert(
    `Cannot set ${context.resourceKey.type}.${context.field.name} directly. Set \`data\` on the relationship document instead: \`record.${context.field.name}.data = value\``
  );
  return false;
}
