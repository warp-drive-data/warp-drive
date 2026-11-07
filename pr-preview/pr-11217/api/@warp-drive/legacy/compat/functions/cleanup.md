---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/legacy/compat/functions/cleanup.md
description: >-
  Legacy store teardown hook that destroys every adapter and serializer instance
  the store has cached.
---

&#x20;

# &#x20;cleanup()

```ts
function cleanup(this: Store$1): void;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:398](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/legacy/src/compat.ts#L398)

Destroys any adapters/serializers the legacy network layer has created
for this store, invoked when the store itself is destroyed.

## Parameters

### this

`Store$1`

## Returns

`void`
