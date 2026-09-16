---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/experiments/storage/functions/LocalResource.md
---

&#x20;

# &#x20;LocalResource()

```ts
function LocalResource(id): ClassDecorator;
```

Defined in: [storage/storage-resource.ts:29](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage-resource.ts#L29)

Decorator which transforms a class into a StorageResource
persisted in localStorage.

LocalResources must either be singletons or expect all instances
to share state unless a primary key function is provided.

When a primary key function is provided, each instance
will have its own persisted data based on the key generated
by the function.

The function will be called once per instance during
initialization to determine the unique ID for that instance.

## Parameters

### id

`string` | [`KeyFn`](../type-aliases/KeyFn.md)

## Returns

`ClassDecorator`
