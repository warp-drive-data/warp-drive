---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/spec/json-api-raw/types/ResourceIdentifierObject.md
---

# &#x20;ResourceIdentifierObject\<T *extends* `string` = `string`>

```ts
type ResourceIdentifierObject<T extends string = string> = 
  | ResourceIdentifier
  | ExistingResourceIdentifierObject<T>
| NewResourceIdentifierObject<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:186](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L186)

A reference to a resource, in any of the forms WarpDrive's cache accepts.

See also:

* [ResourceIdentifier](ResourceIdentifier.md)
* ExistingResourceIdentifierObject
* NewResourceIdentifierObject

[{json:api} Spec](https://jsonapi.org/format/#document-resource-identifier-objects)

## Type Parameters

### T

`T` *extends* `string` = `string`
