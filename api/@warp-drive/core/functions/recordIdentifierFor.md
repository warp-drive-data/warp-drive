---
url: /api/@warp-drive/core/functions/recordIdentifierFor.md
---

# &#x20;recordIdentifierFor()

## Call Signature

```ts
function recordIdentifierFor<T>(record): ResourceKey<TypeFromInstance<T>>;
```

Defined in: [warp-drive-packages/core/src/store/-private/caches/instance-cache.ts:53](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-private/caches/instance-cache.ts#L53)

Retrieves the unique referentially-stable [ResourceKey](../types/identifier/type-aliases/ResourceKey.md)
assigned to the given record instance.

```js
import { recordIdentifierFor } from "@warp-drive/core";
// ... gain access to a record, for instance with peekRecord or findRecord
const record = store.peekRecord("user", "1");
// get the identifier for the record (see docs for ResourceKey)
const identifier = recordIdentifierFor(record);
// access the identifier's properties.
const { id, type, lid } = identifier;
```

### Type Parameters

#### T

`T` *extends* [`TypedRecordInstance`](../types/record/interfaces/TypedRecordInstance.md)

### Parameters

#### record

`T`

a record instance previously obstained from the store.

### Returns

[`ResourceKey`](../types/identifier/type-aliases/ResourceKey.md)<[`TypeFromInstance`](../types/record/type-aliases/TypeFromInstance.md)<`T`>>

## Call Signature

```ts
function recordIdentifierFor(record): ResourceKey;
```

Defined in: [warp-drive-packages/core/src/store/-private/caches/instance-cache.ts:54](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-private/caches/instance-cache.ts#L54)

Retrieves the unique referentially-stable [ResourceKey](../types/identifier/type-aliases/ResourceKey.md)
assigned to the given record instance.

```js
import { recordIdentifierFor } from "@warp-drive/core";
// ... gain access to a record, for instance with peekRecord or findRecord
const record = store.peekRecord("user", "1");
// get the identifier for the record (see docs for ResourceKey)
const identifier = recordIdentifierFor(record);
// access the identifier's properties.
const { id, type, lid } = identifier;
```

### Parameters

#### record

`unknown`

a record instance previously obstained from the store.

### Returns

[`ResourceKey`](../types/identifier/type-aliases/ResourceKey.md)
