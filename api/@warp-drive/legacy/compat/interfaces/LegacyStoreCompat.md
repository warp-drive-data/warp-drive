---
url: /api/@warp-drive/legacy/compat/interfaces/LegacyStoreCompat.md
---

&#x20;

# &#x20;LegacyStoreCompat

Defined in: [warp-drive-packages/legacy/src/compat.ts:31](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L31)

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

#### Call Signature

```ts
adapterFor(this, modelName): MinimumAdapterInterface;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:41](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L41)

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
   this, 
   modelName, 
   _allowMissing
): MinimumAdapterInterface | undefined;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:47](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L47)

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
normalize(modelName, payload): ObjectValue;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:59](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L59)

Normalizes a payload for the given model type using its serializer.
See [normalize](../functions/normalize.md).

#### Parameters

##### modelName

`string`

##### payload

[`ObjectValue`](../../../core/types/json/raw/interfaces/ObjectValue.md)

#### Returns

[`ObjectValue`](../../../core/types/json/raw/interfaces/ObjectValue.md)

***

### pushPayload()

```ts
pushPayload(modelName, payload): void;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:65](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L65)

Pushes a payload into the store using the appropriate serializer to
normalize it first. See [pushPayload](../functions/pushPayload.md).

#### Parameters

##### modelName

`string`

##### payload

[`ObjectValue`](../../../core/types/json/raw/interfaces/ObjectValue.md)

#### Returns

`void`

***

### serializeRecord()

```ts
serializeRecord(record, options?): unknown;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:70](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L70)

Serializes a record using its serializer. See [serializeRecord](../functions/serializeRecord.md).

#### Parameters

##### record

`unknown`

##### options?

[`SerializerOptions`](../type-aliases/SerializerOptions.md)

#### Returns

`unknown`

***

### serializerFor()

```ts
serializerFor<K>(modelName, _allowMissing?): MinimumSerializerInterface | null;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:53](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L53)

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
