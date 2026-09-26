---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/legacy/compat/extensions/types/WithEmberObject.md
---

&#x20;

# &#x20;WithEmberObject\<T>

```ts
type WithEmberObject<T> = T & Pick<T & EmberObject, ArrayType<typeof EmberObjectMethods>>;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:381](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/legacy/src/compat/extensions.ts#L381)

Adds the classic `EmberObject` API (as registered by [EmberObjectExtension](../variables/EmberObjectExtension.md)/
[EmberObjectArrayExtension](../variables/EmberObjectArrayExtension.md)) to the type of a reactive resource.

## Type Parameters

### T

`T`
