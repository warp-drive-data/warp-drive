---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/spec/json-api-raw/types/ResourceIdentifierObject.md
---

# &#x20;ResourceIdentifierObject\<T *extends* `string` = `string`>

```ts
type ResourceIdentifierObject<T extends string = string> = 
  | ResourceIdentifier
  | ExistingResourceIdentifierObject<T>
| NewResourceIdentifierObject<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:186](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L186)

A reference to a resource, in any of the forms WarpDrive's cache accepts.

See also:

* [ResourceIdentifier](ResourceIdentifier.md)
* ExistingResourceIdentifierObject
* NewResourceIdentifierObject

[{json:api} Spec](https://jsonapi.org/format/#document-resource-identifier-objects)

## Type Parameters

### T

`T` *extends* `string` = `string`
