---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/functions/makeInitializer.md
---

# &#x20;makeInitializer()

```ts
function makeInitializer(fn): Initializer;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:27](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/signals/reactivity/internal.ts#L27)

Wraps `fn` so that a signal can recognize it as a lazy initializer
for its value rather than the value itself, deferring the call to
`fn` until the signal is first accessed.

## Parameters

### fn

() => `unknown`

## Returns

`Initializer`
