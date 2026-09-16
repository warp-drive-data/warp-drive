---
url: /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/functions/signal.md
---

# &#x20;signal()

```ts
function signal<T, K>(
   target, 
   key, 
   descriptor?
): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/signal.ts:107](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/signals/reactivity/signal.ts#L107)

Decorator version of creating a signal.

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

### descriptor?

`DecoratorPropertyDescriptor`

## Returns

`void`
