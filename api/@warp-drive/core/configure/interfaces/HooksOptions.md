---
url: /api/@warp-drive/core/configure/interfaces/HooksOptions.md
---

# &#x20;HooksOptions

Defined in: [warp-drive-packages/core/src/signals/reactivity/configure.ts:133](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/signals/reactivity/configure.ts#L133)

Contains information a [SignalHooks](SignalHooks.md) implementation may want
to use, such as the specialized key used for the signal
representing an array's contents / length.

```ts
interface HooksOptions {
  wellknown: {
    Array: symbol | string;
  }
}
```

## Properties

### wellknown

```ts
wellknown: object;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/configure.ts:139](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/signals/reactivity/configure.ts#L139)

A list of specialized symbols/strings
used by WarpDrive to encapsulate key
reactivity concerns.

#### Array

```ts
Array: string | symbol;
```

The key used when the signal provides reactivity for the
`length` or "contents" of an array.

Arrays only use a single signal for all accesses, regardless
of index, property or method: this one.
