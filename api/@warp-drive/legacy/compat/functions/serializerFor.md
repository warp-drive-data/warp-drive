---
url: /api/@warp-drive/legacy/compat/functions/serializerFor.md
---

&#x20;

# &#x20;serializerFor()

```ts
function serializerFor(this: Store$1, modelName: string): 
  | MinimumSerializerInterface
  | null;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:161](https://github.com/warp-drive-data/warp-drive/blob/331a6acae2c14f865cc913111e8f3f2d4f6d7e44/warp-drive-packages/legacy/src/compat.ts#L161)

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

| [`MinimumSerializerInterface`](../types/MinimumSerializerInterface.md)
| `null`
