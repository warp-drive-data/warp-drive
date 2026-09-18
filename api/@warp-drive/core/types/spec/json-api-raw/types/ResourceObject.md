---
url: /api/@warp-drive/core/types/spec/json-api-raw/types/ResourceObject.md
---

# &#x20;ResourceObject\<T *extends* `string` = `string`>

```ts
type ResourceObject<T extends string = string> = 
  | ExistingResourceObject<T>
| NewResourceObject<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:334](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L334)

Represents a single {json:api} resource object, whether already
persisted or newly created on the client.

See also:

* [ExistingResourceObject](ExistingResourceObject.md)
* [NewResourceObject](NewResourceObject.md)

[{json:api} Spec](https://jsonapi.org/format/#document-resource-objects)

## Type Parameters

### T

`T` *extends* `string` = `string`
