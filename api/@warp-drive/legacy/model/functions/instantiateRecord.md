---
url: /api/@warp-drive/legacy/model/functions/instantiateRecord.md
---

&#x20;

# &#x20;instantiateRecord()

```ts
function instantiateRecord(
   this: Store$1, 
   identifier: ResourceKey, 
   createRecordArgs?: {
     [key: string]: unknown;
}
): Model;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:21](https://github.com/warp-drive-data/warp-drive/blob/8469e17a196969acc93511c466120ba3296f8da7/warp-drive-packages/legacy/src/model/-private/hooks.ts#L21)

The `instantiateRecord` hook implementation for use with `Model`. Pass
this to your store's `instantiateRecord` method when configuring the
store to use `Model` for schema/record instantiation.

## Parameters

### this

`Store$1`

### identifier

[`ResourceKey`](../../../core/types/identifier/types/ResourceKey.md)

### createRecordArgs?

## Returns

[`Model`](../classes/Model.md)
