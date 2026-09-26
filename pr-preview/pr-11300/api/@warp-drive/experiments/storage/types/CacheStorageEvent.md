---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/experiments/storage/types/CacheStorageEvent.md
---

&#x20;

# &#x20;CacheStorageEvent

```ts
interface CacheStorageEvent {
  key: string | null;
  newValue: string | null;
  oldValue: string | null;
  storageArea: CacheStorage;
}
```

Defined in: [warp-drive-packages/experiments/src/storage/cache.ts:14](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/experiments/src/storage/cache.ts#L14)

## Properties

### key

```ts
key: string | null;
```

Defined in: [warp-drive-packages/experiments/src/storage/cache.ts:16](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/experiments/src/storage/cache.ts#L16)

***

### newValue

```ts
newValue: string | null;
```

Defined in: [warp-drive-packages/experiments/src/storage/cache.ts:18](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/experiments/src/storage/cache.ts#L18)

***

### oldValue

```ts
oldValue: string | null;
```

Defined in: [warp-drive-packages/experiments/src/storage/cache.ts:17](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/experiments/src/storage/cache.ts#L17)

***

### storageArea

```ts
storageArea: CacheStorage;
```

Defined in: [warp-drive-packages/experiments/src/storage/cache.ts:15](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/experiments/src/storage/cache.ts#L15)
