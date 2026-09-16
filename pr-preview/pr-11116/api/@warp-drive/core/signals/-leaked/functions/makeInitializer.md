---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/signals/-leaked/functions/makeInitializer.md
---

# &#x20;makeInitializer()

```ts
function makeInitializer(fn): Initializer;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:27](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/reactivity/internal.ts#L27)

Wraps `fn` so that a signal can recognize it as a lazy initializer
for its value rather than the value itself, deferring the call to
`fn` until the signal is first accessed.

## Parameters

### fn

() => `unknown`

## Returns

`Initializer`
