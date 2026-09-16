---
url: /api/@warp-drive/core/signals/-leaked/functions/signal.md
---

# &#x20;signal()

```ts
function signal<T, K>(
   target, 
   key, 
   descriptor?
): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/signal.ts:107](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/signals/reactivity/signal.ts#L107)

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
