---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/experiments/storage/types/KeyFn.md
---

&#x20;

# &#x20;KeyFn

```ts
type KeyFn = (obj: any) => string;
```

Defined in: [warp-drive-packages/experiments/src/storage/-private/storage-infra.ts:43](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/experiments/src/storage/-private/storage-infra.ts#L43)

A function which generates a unique primary-key
string for a given LocalResource or SessionResource
instance.

Use functions when you want to create more than
one instance of a resource type, each with its own
persisted data.

## Parameters

### obj

`any`

## Returns

`string`
