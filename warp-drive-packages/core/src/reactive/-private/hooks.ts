import { assert } from '@warp-drive/core/build-config/macros';

import type { Store } from '../../index.ts';
import type { ResourceKey } from '../../types.ts';
import { isResourceSchema } from '../../types/schema/fields.ts';
import { ReactiveResource } from './record.ts';
import type { SchemaService } from './schema.ts';
import { Destroy } from './symbols.ts';

/**
 * The store's default `instantiateRecord` hook implementation, which
 * produces a {@link ReactiveResource} for `identifier` using the resource
 * schema registered for its type.
 *
 * `createArgs` are only applied (via `Object.assign`) when the resource's
 * schema is `legacy`, matching the historical behavior of assigning initial
 * properties when creating a new legacy record.
 *
 * @public
 */
export function instantiateRecord(
  store: Store,
  identifier: ResourceKey,
  createArgs?: Record<string, unknown>
): ReactiveResource {
  const schema = store.schema as unknown as SchemaService;
  const resourceSchema = schema.resource(identifier);
  assert(`Expected a resource schema`, isResourceSchema(resourceSchema));
  const legacy = resourceSchema?.legacy ?? false;
  const editable = legacy;
  const record = new ReactiveResource({
    store,
    resourceKey: identifier,
    modeName: legacy ? 'legacy' : 'polaris',
    legacy: legacy,
    editable: editable,
    destroyables: new Set(),
    path: null,
    field: null,
    value: null,
  });

  if (createArgs && editable) {
    Object.assign(record, createArgs);
  }

  return record;
}

function assertReactiveResource(record: unknown): asserts record is ReactiveResource {
  assert('Expected a ReactiveResource', record && typeof record === 'object' && Destroy in record);
}

/**
 * The store's default `teardownRecord` hook implementation, which asserts
 * that `record` is a {@link ReactiveResource} and invokes its `Destroy`
 * behavior.
 *
 * @public
 */
export function teardownRecord(record: unknown): void {
  assertReactiveResource(record);
  record[Destroy]();
}
