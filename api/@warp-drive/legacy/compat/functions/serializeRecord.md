---
url: /api/@warp-drive/legacy/compat/functions/serializeRecord.md
---

&#x20;

# &#x20;serializeRecord()

```ts
function serializeRecord(
   this, 
   record, 
   options?
): unknown;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:328](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L328)

Serializes a record using the store's legacy network layer, as with
[store.serializeRecord](../interfaces/LegacyStoreCompat.md#serializerecord).

## Parameters

### this

`Store$1`

### record

`unknown`

### options?

[`SerializerOptions`](../type-aliases/SerializerOptions.md)

## Returns

`unknown`
