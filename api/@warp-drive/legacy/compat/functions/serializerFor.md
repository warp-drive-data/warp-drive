---
url: /api/@warp-drive/legacy/compat/functions/serializerFor.md
---

&#x20;

# &#x20;serializerFor()

```ts
function serializerFor(this, modelName): 
  | MinimumSerializerInterface
  | null;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:161](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat.ts#L161)

Returns an instance of the serializer for a given type. For
example, `serializerFor('person')` will return an instance of
`App.PersonSerializer`.

If no `App.PersonSerializer` is found, this method will look
for an `App.ApplicationSerializer` (the default serializer for
your entire application).

If a serializer cannot be found on the adapter, it will fall back
to an instance of `JSONSerializer`.

## Parameters

### this

`Store$1`

### modelName

`string`

the record to serialize

## Returns

| [`MinimumSerializerInterface`](../interfaces/MinimumSerializerInterface.md)
| `null`
