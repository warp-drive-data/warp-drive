---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/legacy/model/functions/instantiateRecord.md
---

&#x20;

# &#x20;instantiateRecord()

```ts
function instantiateRecord(
   this, 
   identifier, 
   createRecordArgs?
): Model;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:21](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/model/-private/hooks.ts#L21)

The `instantiateRecord` hook implementation for use with `Model`. Pass
this to your store's `instantiateRecord` method when configuring the
store to use `Model` for schema/record instantiation.

## Parameters

### this

`Store$1`

### identifier

[`ResourceKey`](../../../core/types/identifier/type-aliases/ResourceKey.md)

### createRecordArgs?

## Returns

[`Model`](../classes/Model.md)
