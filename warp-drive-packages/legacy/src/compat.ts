/**
 * Helps an app migrate incrementally from legacy EmberData patterns to modern ***Warp*Drive**.
 *
 * ## Why it exists
 *
 * While migrating, you may need to:
 *
 * - keep Adapters and Serializers working on a Store whose requests go through the
 *   {@link RequestManager}
 * - keep the deprecated request methods such as `store.findRecord` and `store.query`, which
 *   Adapters fulfill, working while you move calls to `store.request`
 * - adopt modern patterns one piece at a time rather than all at once
 *
 * ## What it provides
 *
 * - {@link LegacyNetworkHandler}, a request handler that fulfills those legacy requests through
 *   the store's Adapters and Serializers and passes every other request along
 * - {@link adapterFor}, {@link serializerFor}, {@link normalize}, {@link pushPayload} and
 *   {@link serializeRecord}, the store methods for working with Adapters and Serializers, and
 *   {@link LegacyStoreCompat}, the Store type that includes them
 *
 * The Store that [useLegacyStore](/api/@warp-drive/legacy/functions/useLegacyStore) produces
 * adds `LegacyNetworkHandler` to its RequestManager unless `linksMode` is `true`. The hooks
 * that present `Model` instances live in [@warp-drive/legacy/model](/api/@warp-drive/legacy/model/),
 * not here.
 *
 * ## When to use it
 *
 * Only during a migration from legacy EmberData to modern ***Warp*Drive**. It lets you adopt
 * modern patterns incrementally while your existing Adapters and Serializers keep working. For
 * incremental migration strategies, see the [Migration Guide](/upgrading/v5/) and the
 * [Two Store Migration Strategy](/upgrading/v5/two-store-migration).
 *
 * @module
 * @summary Legacy store support for adapters and serializers: the `LegacyNetworkHandler` plus store methods such as
 * `adapterFor`, `serializerFor`, `normalize` and `pushPayload`.
 */

import { getOwner } from '@ember/application';

// oxlint-disable-next-line no-unused-vars
import type { RequestManager } from '@warp-drive/core';
import { recordIdentifierFor, type Store } from '@warp-drive/core';
import { assert } from '@warp-drive/core/build-config/macros';
import { _deprecatingNormalize } from '@warp-drive/core/store/-private';
import type { ObjectValue } from '@warp-drive/core/types/json/raw';
import type { SingleResourceDocument } from '@warp-drive/core/types/spec/json-api-raw';

import { FetchManager, upgradeStore } from './compat/-private.ts';
import type {
  AdapterPayload,
  MinimumAdapterInterface,
} from './compat/legacy-network-handler/minimum-adapter-interface.ts';
import type {
  MinimumSerializerInterface,
  SerializerOptions,
} from './compat/legacy-network-handler/minimum-serializer-interface.ts';

export { LegacyNetworkHandler } from './compat/legacy-network-handler/legacy-network-handler.ts';

export type { MinimumAdapterInterface, MinimumSerializerInterface, SerializerOptions, AdapterPayload };

/**
 * Extends the signature of {@link Store} with additional
 * methods available when using the legacy network layer.
 *
 * @summary Legacy `Store` type extended with `adapterFor`, `serializerFor`, `normalize`, `pushPayload`, and
 * `serializeRecord` from the adapter and serializer network layer.
 * @public
 * @noInheritDoc
 * @legacy
 */
export interface LegacyStoreCompat extends Store {
  /**
   * @private
   */
  _fetchManager: FetchManager;

  /**
   * Returns the adapter instance for the given model type, instantiating
   * it (and caching the instance) if necessary. See {@link adapterFor}.
   */
  adapterFor(this: Store, modelName: string): MinimumAdapterInterface;
  /**
   * Same as the single-argument overload, but returns `undefined` instead
   * of throwing/asserting when `_allowMissing` is `true` and no adapter
   * is found.
   */
  adapterFor(this: Store, modelName: string, _allowMissing: true): MinimumAdapterInterface | undefined;

  /**
   * Returns the serializer instance for the given model type, instantiating
   * it (and caching the instance) if necessary. See {@link serializerFor}.
   */
  serializerFor<K extends string>(modelName: K, _allowMissing?: boolean): MinimumSerializerInterface | null;

  /**
   * Normalizes a payload for the given model type using its serializer.
   * See {@link normalize}.
   */
  normalize(modelName: string, payload: ObjectValue): ObjectValue;

  /**
   * Pushes a payload into the store using the appropriate serializer to
   * normalize it first. See {@link pushPayload}.
   */
  pushPayload(modelName: string, payload: ObjectValue): void;

  /**
   * Serializes a record using its serializer. See {@link serializeRecord}.
   */
  serializeRecord(record: unknown, options?: SerializerOptions): unknown;

  /**
   * @private
   */
  _adapterCache: Record<string, MinimumAdapterInterface & { store: Store }>;
  /**
   * @private
   */
  _serializerCache: Record<string, MinimumSerializerInterface & { store: Store }>;
}

/**
 * @summary Deprecated alias of `LegacyStoreCompat`, the `Store` type extended with legacy adapter and serializer
 * methods.
 * @deprecated - use {@link LegacyStoreCompat} instead
 */
export type CompatStore = LegacyStoreCompat;

/**
  Returns an instance of the adapter for a given type. For
  example, `adapterFor('person')` will return an instance of
  the adapter located at `app/adapters/person.js`

  If no `person` adapter is found, this method will look
  for an `application` adapter (the default adapter for
  your entire application).

  @summary Legacy store method that returns the cached adapter for a model type, falling back to the `application`
  adapter.
  @public
  @param modelName
*/
export function adapterFor(this: Store, modelName: string): MinimumAdapterInterface;
export function adapterFor(this: Store, modelName: string, _allowMissing: true): MinimumAdapterInterface | undefined;
export function adapterFor(this: Store, modelName: string, _allowMissing?: true): MinimumAdapterInterface | undefined {
  assert(
    `Attempted to call store.adapterFor(), but the store instance has already been destroyed.`,
    !(this.isDestroying || this.isDestroyed)
  );
  assert(`You need to pass a model name to the store's adapterFor method`, modelName);
  assert(
    `Passing classes to store.adapterFor has been removed. Please pass a dasherized string instead of ${modelName}`,
    typeof modelName === 'string'
  );
  upgradeStore(this);
  this._adapterCache =
    this._adapterCache || (Object.create(null) as Record<string, MinimumAdapterInterface & { store: Store }>);

  const normalizedModelName = _deprecatingNormalize(modelName);

  const { _adapterCache } = this;
  let adapter: (MinimumAdapterInterface & { store: Store }) | undefined = _adapterCache[normalizedModelName];
  if (adapter) {
    return adapter;
  }

  const owner = getOwner(this)!;

  // name specific adapter
  adapter = owner.lookup(`adapter:${normalizedModelName}`) as (MinimumAdapterInterface & { store: Store }) | undefined;
  if (adapter !== undefined) {
    _adapterCache[normalizedModelName] = adapter;
    return adapter;
  }

  // no adapter found for the specific name, fallback and check for application adapter
  adapter = _adapterCache.application || owner.lookup('adapter:application');
  if (adapter !== undefined) {
    _adapterCache[normalizedModelName] = adapter;
    _adapterCache.application = adapter;
    return adapter;
  }

  assert(
    `No adapter was found for '${modelName}' and no 'application' adapter was found as a fallback.`,
    _allowMissing
  );
}

/**
  Returns an instance of the serializer for a given type. For
  example, `serializerFor('person')` will return an instance of
  `App.PersonSerializer`.

  If no `App.PersonSerializer` is found, this method will look
  for an `App.ApplicationSerializer` (the default serializer for
  your entire application).

  If a serializer cannot be found on the adapter, it will fall back
  to an instance of `JSONSerializer`.

  @summary Legacy store method that returns the cached serializer for a model type, falling back to the
  `application` serializer, or `null` if neither exists.
  @public
  @param modelName the record to serialize
  */
export function serializerFor(this: Store, modelName: string): MinimumSerializerInterface | null {
  assert(
    `Attempted to call store.serializerFor(), but the store instance has already been destroyed.`,
    !(this.isDestroying || this.isDestroyed)
  );
  assert(`You need to pass a model name to the store's serializerFor method`, modelName);
  assert(
    `Passing classes to store.serializerFor has been removed. Please pass a dasherized string instead of ${modelName}`,
    typeof modelName === 'string'
  );
  upgradeStore(this);
  this._serializerCache =
    this._serializerCache || (Object.create(null) as Record<string, MinimumSerializerInterface & { store: Store }>);
  const normalizedModelName = _deprecatingNormalize(modelName);

  const { _serializerCache } = this;
  let serializer: (MinimumSerializerInterface & { store: Store }) | undefined = _serializerCache[normalizedModelName];
  if (serializer) {
    return serializer;
  }

  // by name
  const owner = getOwner(this)!;
  serializer = owner.lookup(`serializer:${normalizedModelName}`) as
    | (MinimumSerializerInterface & { store: Store })
    | undefined;
  if (serializer !== undefined) {
    _serializerCache[normalizedModelName] = serializer;
    return serializer;
  }

  // no serializer found for the specific model, fallback and check for application serializer
  serializer = _serializerCache.application || owner.lookup('serializer:application');
  if (serializer !== undefined) {
    _serializerCache[normalizedModelName] = serializer;
    _serializerCache.application = serializer;
    return serializer;
  }

  return null;
}

/**
  `normalize` converts a json payload into the normalized form expected by
  {@link Store.push | push} using the serializer specified by `modelName`

  :::warning
  Generally it would be better to invoke the serializer yourself directly,
  or write a more specialized normalization utility.
  :::

  Example

  ```js
  socket.on('message', function(message) {
    let modelName = message.model;
    let data = message.data;
    store.push(store.normalize(modelName, data));
  });
  ```

  @summary Legacy store method that converts a raw payload into the normalized document `store.push` expects, using
  the serializer for the given model type.
  @legacy
  @public
  @param modelName The name of the model type for this payload
  @return The normalized payload
*/
// TODO @runspired @deprecate users should call normalize on the associated serializer directly
export function normalize(this: Store, modelName: string, payload: ObjectValue): SingleResourceDocument {
  upgradeStore(this);
  assert(
    `Attempted to call store.normalize(), but the store instance has already been destroyed.`,
    !(this.isDestroying || this.isDestroyed)
  );
  assert(`You need to pass a model name to the store's normalize method`, modelName);
  assert(
    `Passing classes to store methods has been removed. Please pass a dasherized string instead of ${typeof modelName}`,
    typeof modelName === 'string'
  );
  const normalizedModelName = _deprecatingNormalize(modelName);
  const serializer = this.serializerFor(normalizedModelName);
  const schema = this.modelFor(normalizedModelName);
  assert(
    `You must define a normalize method in your serializer in order to call store.normalize`,
    typeof serializer?.normalize === 'function'
  );
  return serializer.normalize(schema, payload);
}

/**
    Push some raw data into the store.

    This method can be used both to push in brand new
    records, as well as to update existing records. You
    can push in more than one type of object at once.
    All objects should be in the format expected by the
    serializer.

    ```js [app/serializers/application.js]
    import RESTSerializer from '@warp-drive/legacy/serializer/rest';

    export default class ApplicationSerializer extends RESTSerializer;
    ```

    ```js
    let pushData = {
      posts: [
        { id: 1, postTitle: "Great post", commentIds: [2] }
      ],
      comments: [
        { id: 2, commentBody: "Insightful comment" }
      ]
    }

    store.pushPayload(pushData);
    ```

    By default, the data will be deserialized using a default
    serializer (the application serializer if it exists).

    Alternatively, `pushPayload` will accept a model type which
    will determine which serializer will process the payload.

    ```js [app/serializers/application.js]
    import RESTSerializer from '@warp-drive/legacy/serializer/rest';

     export default class ApplicationSerializer extends RESTSerializer;
    ```

    ```js [app/serializers/post.js]
    import JSONSerializer from '@warp-drive/legacy/serializer/json';

    export default JSONSerializer;
    ```

    ```js
    store.pushPayload(pushData); // Will use the application serializer
    store.pushPayload('post', pushData); // Will use the post serializer
    ```

    @summary Legacy store method that pushes a raw payload into the store after the application serializer, or the
    given model type's serializer, normalizes it.
    @public
    @param modelName Optionally, a model type used to determine which serializer will be used
    @param inputPayload
  */
// TODO @runspired @deprecate pushPayload in favor of looking up the serializer
export function pushPayload(this: Store, modelName: string, inputPayload: ObjectValue): void {
  upgradeStore(this);
  assert(
    `Attempted to call store.pushPayload(), but the store instance has already been destroyed.`,
    !(this.isDestroying || this.isDestroyed)
  );

  const payload: ObjectValue = inputPayload || (modelName as unknown as ObjectValue);
  const normalizedModelName = inputPayload ? _deprecatingNormalize(modelName) : 'application';
  const serializer = this.serializerFor(normalizedModelName);

  assert(
    `You cannot use 'store.pushPayload(<type>, <payload>)' unless the serializer for '${normalizedModelName}' defines 'pushPayload'`,
    serializer && typeof serializer.pushPayload === 'function'
  );
  serializer.pushPayload(this, payload);
}

/**
 * Serializes a record using the store's legacy network layer, as with
 * {@link LegacyStoreCompat.serializeRecord | store.serializeRecord}.
 *
 * @summary Legacy store method that serializes a record into a payload using its model type's serializer.
 */
// TODO @runspired @deprecate records should implement their own serialization if desired
export function serializeRecord(this: Store, record: unknown, options?: SerializerOptions): unknown {
  upgradeStore(this);
  // TODO we used to check if the record was destroyed here
  if (!this._fetchManager) {
    this._fetchManager = new FetchManager(this);
  }

  return this._fetchManager.createSnapshot(recordIdentifierFor(record)).serialize(options);
}

/**
 * Destroys any adapters/serializers the legacy network layer has created
 * for this store, invoked when the store itself is destroyed.
 *
 * @summary Legacy store teardown hook that destroys every adapter and serializer instance the store has cached.
 */
export function cleanup(this: Store): void {
  upgradeStore(this);
  // enqueue destruction of any adapters/serializers we have created
  for (const adapterName in this._adapterCache) {
    const adapter = this._adapterCache[adapterName];
    if (typeof adapter.destroy === 'function') {
      adapter.destroy();
    }
  }

  for (const serializerName in this._serializerCache) {
    const serializer = this._serializerCache[serializerName];
    if (typeof serializer.destroy === 'function') {
      serializer.destroy();
    }
  }
}
