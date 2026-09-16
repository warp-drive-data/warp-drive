---
url: >-
  /api/@warp-drive/core/types/spec/json-api-raw/type-aliases/ResourceIdentifierObject.md
---

# &#x20;ResourceIdentifierObject\<T>

```ts
type ResourceIdentifierObject<T> = 
  | ResourceIdentifier
  | ExistingResourceIdentifierObject<T>
| NewResourceIdentifierObject<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:186](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L186)

A reference to a resource, in any of the forms WarpDrive's cache accepts.

See also:

* [ResourceIdentifier](../interfaces/ResourceIdentifier.md)
* ExistingResourceIdentifierObject
* NewResourceIdentifierObject

[{json:api} Spec](https://jsonapi.org/format/#document-resource-identifier-objects)

## Type Parameters

### T

`T` *extends* `string` = `string`
