---
url: /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/functions/waitFor.md
---

# &#x20;waitFor()

```ts
function waitFor<K>(promise): Promise<K>;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/configure.ts:228](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/signals/reactivity/configure.ts#L228)

Wraps `promise` using the configured [SignalHooks.waitFor](../../../configure/interfaces/SignalHooks.md#waitfor), if any,
for things like test-waiters. Returns `promise` unchanged if no
`waitFor` hook is configured.

## Type Parameters

### K

`K`

## Parameters

### promise

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`K`>

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`K`>
