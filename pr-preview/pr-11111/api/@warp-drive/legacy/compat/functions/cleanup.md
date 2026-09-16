---
url: /pr-preview/pr-11111/api/@warp-drive/legacy/compat/functions/cleanup.md
---

&#x20;

# &#x20;cleanup()

```ts
function cleanup(this): void;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:342](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/compat.ts#L342)

Destroys any adapters/serializers the legacy network layer has created
for this store, invoked when the store itself is destroyed.

## Parameters

### this

`Store$1`

## Returns

`void`
