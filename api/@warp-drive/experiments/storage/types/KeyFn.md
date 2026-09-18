---
url: /api/@warp-drive/experiments/storage/types/KeyFn.md
---

&#x20;

# &#x20;KeyFn

```ts
type KeyFn = (obj: any) => string;
```

Defined in: [storage/-private/storage-infra.ts:43](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/experiments/src/storage/-private/storage-infra.ts#L43)

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
