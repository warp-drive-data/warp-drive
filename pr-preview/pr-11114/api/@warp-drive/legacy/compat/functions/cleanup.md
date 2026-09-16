---
url: /pr-preview/pr-11114/api/@warp-drive/legacy/compat/functions/cleanup.md
---

&#x20;

# &#x20;cleanup()

```ts
function cleanup(this): void;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:342](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/legacy/src/compat.ts#L342)

Destroys any adapters/serializers the legacy network layer has created
for this store, invoked when the store itself is destroyed.

## Parameters

### this

`Store$1`

## Returns

`void`
