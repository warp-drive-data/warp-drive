---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/types/LegacyStoreCompat.md
description: >-
  Legacy `Store` type extended with `adapterFor`, `serializerFor`, `normalize`,
  `pushPayload`, and `serializeRecord` from the adapter and serializer network
  layer.
---

&#x20;

# &#x20;LegacyStoreCompat

```ts
interface LegacyStoreCompat extends Store$1 {
  [key: string]: any;
  adapterFor(this: Store$1, modelName: string): MinimumAdapterInterface;
  adapterFor(this: Store$1, modelName: string, _allowMissing: true): MinimumAdapterInterface | undefined;
  normalize(modelName: string, payload: ObjectValue): ObjectValue;
  pushPayload(modelName: string, payload: ObjectValue): void;
  serializeRecord(record: unknown, options?: SerializerOptions): unknown;
  serializerFor<K extends string>(modelName: K, _allowMissing?: boolean): MinimumSerializerInterface | null;
}
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:39](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L39)

**`No Inherit Doc`** **`Legacy`**

Extends the signature of Store with additional
methods available when using the legacy network layer.

## Extends

* `Store$1`

## Indexable

```ts
[key: string]: any
```

## Methods

### adapterFor()

```ts
adapterFor(this: Store$1, modelName: string): MinimumAdapterInterface;
adapterFor(
   this: Store$1, 
   modelName: string, 
   _allowMissing: true
): MinimumAdapterInterface | undefined;
```

#### Call Signature

```ts
adapterFor(this: Store$1, modelName: string): MinimumAdapterInterface;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:49](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L49)

Returns the adapter instance for the given model type, instantiating
it (and caching the instance) if necessary. See [adapterFor](../functions/adapterFor.md).

##### Parameters

###### this

`Store$1`

###### modelName

`string`

##### Returns

[`MinimumAdapterInterface`](MinimumAdapterInterface.md)

#### Call Signature

```ts
adapterFor(
   this: Store$1, 
   modelName: string, 
   _allowMissing: true
): MinimumAdapterInterface | undefined;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:55](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L55)

Same as the single-argument overload, but returns `undefined` instead
of throwing/asserting when `_allowMissing` is `true` and no adapter
is found.

##### Parameters

###### this

`Store$1`

###### modelName

`string`

###### \_allowMissing

`true`

##### Returns

[`MinimumAdapterInterface`](MinimumAdapterInterface.md) | `undefined`

***

### normalize()

```ts
normalize(modelName: string, payload: ObjectValue): ObjectValue;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:67](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L67)

Normalizes a payload for the given model type using its serializer.
See [normalize](../functions/normalize.md).

#### Parameters

##### modelName

`string`

##### payload

[`ObjectValue`](../../../core/types/json/raw/types/ObjectValue.md)

#### Returns

[`ObjectValue`](../../../core/types/json/raw/types/ObjectValue.md)

***

### pushPayload()

```ts
pushPayload(modelName: string, payload: ObjectValue): void;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:73](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L73)

Pushes a payload into the store using the appropriate serializer to
normalize it first. See [pushPayload](../functions/pushPayload.md).

#### Parameters

##### modelName

`string`

##### payload

[`ObjectValue`](../../../core/types/json/raw/types/ObjectValue.md)

#### Returns

`void`

***

### serializeRecord()

```ts
serializeRecord(record: unknown, options?: SerializerOptions): unknown;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:78](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L78)

Serializes a record using its serializer. See [serializeRecord](../functions/serializeRecord.md).

#### Parameters

##### record

`unknown`

##### options?

[`SerializerOptions`](SerializerOptions.md)

#### Returns

`unknown`

***

### serializerFor()

```ts
serializerFor<K extends string>(modelName: K, _allowMissing?: boolean): MinimumSerializerInterface | null;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:61](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/legacy/src/compat.ts#L61)

Returns the serializer instance for the given model type, instantiating
it (and caching the instance) if necessary. See [serializerFor](../functions/serializerFor.md).

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### modelName

`K`

##### \_allowMissing?

`boolean`

#### Returns

[`MinimumSerializerInterface`](MinimumSerializerInterface.md) | `null`
