---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/experiments/storage/type-aliases/KeyFn.md
---

&#x20;

# &#x20;KeyFn

```ts
type KeyFn = (obj) => string;
```

Defined in: [storage/-private/storage-infra.ts:43](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/-private/storage-infra.ts#L43)

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
