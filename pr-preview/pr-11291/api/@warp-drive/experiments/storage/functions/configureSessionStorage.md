---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/experiments/storage/functions/configureSessionStorage.md
description: >-
  Experimental function that sets fallback and quota-handling options for the
  reactive sessionStorage singleton before its first use.
---

&#x20;

# &#x20;configureSessionStorage()

```ts
function configureSessionStorage(options: ReactiveStorageOptions): void;
```

Defined in: [warp-drive-packages/experiments/src/storage/storage.ts:87](https://github.com/warp-drive-data/warp-drive/blob/48bcd79ff60e6edb86b5f60b53fff9a572cd3711/warp-drive-packages/experiments/src/storage/storage.ts#L87)

Configure options for the sessionStorage singleton.
Must be called before getSessionStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../types/ReactiveStorageOptions.md)

## Returns

`void`
