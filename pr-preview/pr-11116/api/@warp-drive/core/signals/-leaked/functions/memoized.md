---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/signals/-leaked/functions/memoized.md
---

# &#x20;memoized()

```ts
function memoized<T, K>(
   target, 
   key, 
   descriptor
): PropertyDescriptor;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/signal.ts:137](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/reactivity/signal.ts#L137)

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
