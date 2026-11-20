---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/legacy/model/functions/instantiateRecord.md
description: >-
  Legacy store hook that creates a `Model` instance for a resource key using the
  `Model` class registered for its type.
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

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:23](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/legacy/src/model/-private/hooks.ts#L23)

The `instantiateRecord` hook implementation for use with `Model`. Pass
this to your store's `instantiateRecord` method when configuring the
store to use `Model` for schema/record instantiation.

## Parameters

### this

`Store$1`

### identifier

[`ResourceKey`](../../../core/types/identifier/types/ResourceKey.md)

### createRecordArgs?

{
\[`key`: `string`]: `unknown`;
}

## Returns

[`Model`](../classes/Model.md)
