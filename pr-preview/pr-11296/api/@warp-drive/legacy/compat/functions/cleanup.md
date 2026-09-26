---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@warp-drive/legacy/compat/functions/cleanup.md
description: >-
  Legacy store teardown hook that destroys every adapter and serializer instance
  the store has cached.
---

&#x20;

# &#x20;cleanup()

```ts
function cleanup(this: Store$1): void;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:364](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/legacy/src/compat.ts#L364)

Destroys any adapters/serializers the legacy network layer has created
for this store, invoked when the store itself is destroyed.

## Parameters

### this

`Store$1`

## Returns

`void`
