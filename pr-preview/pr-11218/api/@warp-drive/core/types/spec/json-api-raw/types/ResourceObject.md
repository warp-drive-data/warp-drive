---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/types/spec/json-api-raw/types/ResourceObject.md
---

# &#x20;ResourceObject\<T *extends* `string` = `string`>

```ts
type ResourceObject<T extends string = string> = 
  | ExistingResourceObject<T>
| NewResourceObject<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:334](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L334)

Represents a single {json:api} resource object, whether already
persisted or newly created on the client.

See also:

* [ExistingResourceObject](ExistingResourceObject.md)
* [NewResourceObject](NewResourceObject.md)

[{json:api} Spec](https://jsonapi.org/format/#document-resource-objects)

## Type Parameters

### T

`T` *extends* `string` = `string`
