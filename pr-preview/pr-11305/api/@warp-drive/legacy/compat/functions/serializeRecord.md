---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11305/api/@warp-drive/legacy/compat/functions/serializeRecord.md
description: >-
  Legacy store method that serializes a record into a payload using its model
  type's serializer.
---

&#x20;

# &#x20;serializeRecord()

```ts
function serializeRecord(
   this: Store$1, 
   record: unknown, 
   options?: SerializerOptions
): unknown;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:382](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/legacy/src/compat.ts#L382)

Serializes a record using the store's legacy network layer, as with
[store.serializeRecord](../types/LegacyStoreCompat.md#serializerecord).

## Parameters

### this

`Store$1`

### record

`unknown`

### options?

[`SerializerOptions`](../types/SerializerOptions.md)

## Returns

`unknown`
