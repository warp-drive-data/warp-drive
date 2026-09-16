---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/legacy/model-fragments/functions/withArrayDefaults.md
---

&#x20;

# &#x20;withArrayDefaults()

```ts
function withArrayDefaults<ArrayName, PrimitiveType>(arrayName, primitiveType?): PrimitiveType extends undefined ? object : object;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/utilities/with-array-defaults.ts:9](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/legacy/src/model-fragments/utilities/with-array-defaults.ts#L9)

Used as a helper to setup the relevant parts of an array
schema and add extensions etc.

## Type Parameters

### ArrayName

`ArrayName` *extends* `string`

### PrimitiveType

`PrimitiveType` *extends* `string`

## Parameters

### arrayName

`ArrayName`

The name of the array

### primitiveType?

`PrimitiveType`

The primitive type of items in the array (optional)

## Returns

`PrimitiveType` *extends* `undefined` ? `object` : `object`

The schema for an array
