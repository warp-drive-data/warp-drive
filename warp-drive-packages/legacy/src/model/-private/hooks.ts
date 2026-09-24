import { getOwner, setOwner } from '@ember/application';

import { assert } from '@warp-drive/core/build-config/macros';
import { assertPrivateStore, setRecordIdentifier, type Store, StoreMap } from '@warp-drive/core/store/-private';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { TypeFromInstance, TypeFromInstanceOrString } from '@warp-drive/core/types/record';

import type { Model, ModelStore } from './model.ts';
import { getModelFactory } from './schema-provider.ts';
import { normalizeModelName } from './util.ts';

function recast(context: Store): asserts context is ModelStore {}

/**
 * The `instantiateRecord` hook implementation for use with `Model`. Pass
 * this to your store's `instantiateRecord` method when configuring the
 * store to use `Model` for schema/record instantiation.
 *
 * @public
 */
export function instantiateRecord(
  this: Store,
  identifier: ResourceKey,
  createRecordArgs?: { [key: string]: unknown }
): Model {
  const type = identifier.type;

  recast(this);

  // TODO deprecate allowing unknown args setting
  const createOptions = {
    _createProps: createRecordArgs ?? {},
    // TODO @deprecate consider deprecating accessing record properties during init which the below is necessary for
    _secretInit: {
      identifier,
      store: this,
      cb: secretInit,
    },
  };

  // ensure that `getOwner(this)` works inside a model instance
  setOwner(createOptions, getOwner(this)!);
  const factory = getModelFactory(this, type);

  assert(`No model was found for '${type}'`, factory);
  return factory.class.create(createOptions);
}

/**
 * The `teardownRecord` hook implementation for use with `Model`. Pass this
 * to your store's `teardownRecord` method when configuring the store to
 * use `Model` for schema/record instantiation.
 *
 * @public
 */
export function teardownRecord(record: Model): void {
  assert(
    `expected to receive an instance of Model from @warp-drive/legacy/model. If using a custom model make sure you implement teardownRecord`,
    'destroy' in record
  );
  record.destroy();
}

/**
 * The `modelFor` implementation for use with `Model`, exposed on the store
 * as `store.modelFor(type)` when the store is configured to use `Model`.
 * Returns the `Model` subclass registered for the given type, if any.
 *
 * @public
 */
export function modelFor<T>(type: TypeFromInstance<T>): typeof Model | void;
/**
 * Overload accepting a raw type string instead of a typed record instance.
 *
 * @public
 */
export function modelFor(type: string): typeof Model | void;
export function modelFor<T>(this: Store, modelName: TypeFromInstanceOrString<T>): typeof Model | void {
  assertPrivateStore(this);
  assert(
    `Attempted to call store.modelFor(), but the store instance has already been destroyed.`,
    !this.isDestroyed && !this.isDestroying
  );
  assert(`You need to pass a model name to the store's modelFor method`, modelName);
  assert(
    `Please pass a proper model name to the store's modelFor method`,
    typeof modelName === 'string' && modelName.length
  );
  recast(this);

  const type = normalizeModelName(modelName);
  const maybeFactory = getModelFactory(this, type);
  const klass = maybeFactory && maybeFactory.class ? maybeFactory.class : null;

  const ignoreType = !klass || !klass.isModel || this._forceShim;
  if (!ignoreType) {
    return klass;
  }
  assert(`No model was found for '${type}' and no schema handles the type`, this.schema.hasResource({ type }));
}

function secretInit(record: Model, identifier: ResourceKey, store: Store): void {
  setRecordIdentifier(record, identifier);
  StoreMap.set(record, store);
}
