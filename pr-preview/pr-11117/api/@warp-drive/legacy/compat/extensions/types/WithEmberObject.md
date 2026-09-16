---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/legacy/compat/extensions/types/WithEmberObject.md
---

&#x20;

# &#x20;WithEmberObject\<T>

```ts
type WithEmberObject<T> = T & Pick<T & EmberObject, ArrayType<typeof EmberObjectMethods>>;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:381](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/legacy/src/compat/extensions.ts#L381)

Adds the classic `EmberObject` API (as registered by [EmberObjectExtension](../variables/EmberObjectExtension.md)/
[EmberObjectArrayExtension](../variables/EmberObjectArrayExtension.md)) to the type of a reactive resource.

## Type Parameters

### T

`T`
