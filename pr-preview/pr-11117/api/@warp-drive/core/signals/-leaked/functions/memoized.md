---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/signals/-leaked/functions/memoized.md
---

# &#x20;memoized()

```ts
function memoized<T extends object, K extends string>(
   target: T, 
   key: K, 
   descriptor: PropertyDescriptor
): PropertyDescriptor;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/signal.ts:137](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/core/src/signals/reactivity/signal.ts#L137)

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
