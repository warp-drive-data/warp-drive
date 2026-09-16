---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/functions/memoized.md
---

# &#x20;memoized()

```ts
function memoized<T, K>(
   target, 
   key, 
   descriptor
): PropertyDescriptor;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/signal.ts:137](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/signals/reactivity/signal.ts#L137)

Decorator version of creating a memoized getter

## Type Parameters

### T

`T` *extends* `object`

### K

`K` *extends* `string`

## Parameters

### target

`T`

### key

`K`

### descriptor

`PropertyDescriptor`

## Returns

`PropertyDescriptor`
