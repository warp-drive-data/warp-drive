---
url: /api/@warp-drive/experiments/storage/functions/SessionResource.md
---

&#x20;

# &#x20;SessionResource()

```ts
function SessionResource(id): ClassDecorator;
```

Defined in: [storage/storage-resource.ts:47](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/experiments/src/storage/storage-resource.ts#L47)

Decorator which transforms a class into a StorageResource
persisted in sessionStorage.

SessionResources must either be singletons or expect all instances
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
