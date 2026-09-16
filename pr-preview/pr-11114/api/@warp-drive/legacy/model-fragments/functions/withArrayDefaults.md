---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/legacy/model-fragments/functions/withArrayDefaults.md
---

&#x20;

# &#x20;withArrayDefaults()

```ts
function withArrayDefaults<ArrayName, PrimitiveType>(arrayName, primitiveType?): PrimitiveType extends undefined ? object : object;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/utilities/with-array-defaults.ts:9](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/legacy/src/model-fragments/utilities/with-array-defaults.ts#L9)

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
