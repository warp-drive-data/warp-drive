---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/legacy/compat/extensions/types/WithEmberObject.md
---

&#x20;

# &#x20;WithEmberObject\<T>

```ts
type WithEmberObject<T> = T & Pick<T & EmberObject, ArrayType<typeof EmberObjectMethods>>;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:381](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/legacy/src/compat/extensions.ts#L381)

Adds the classic `EmberObject` API (as registered by [EmberObjectExtension](../variables/EmberObjectExtension.md)/
[EmberObjectArrayExtension](../variables/EmberObjectArrayExtension.md)) to the type of a reactive resource.

## Type Parameters

### T

`T`
