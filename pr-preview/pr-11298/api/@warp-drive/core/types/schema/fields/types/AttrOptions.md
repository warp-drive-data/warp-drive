---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/core/types/schema/fields/types/AttrOptions.md
description: >-
  Options object on a legacy `attribute` field schema, holding a `defaultValue`
  (a primitive or a function producing one) plus any transform-specific options.
---

# &#x20;AttrOptions

```ts
interface AttrOptions {
  [key: string]: 
  | Value
  | (() => Value)
  | undefined;
  defaultValue?: 
  | PrimitiveValue
  | (() => Value);
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:19](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/warp-drive-packages/core/src/types/schema/fields.ts#L19)

Options signature for Legacy Attributes.

## Indexable

```ts
[key: string]: 
  | Value
  | (() => Value)
  | undefined
```

## Properties

### defaultValue?

```ts
optional defaultValue?: 
  | PrimitiveValue
  | (() => Value);
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:23](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/warp-drive-packages/core/src/types/schema/fields.ts#L23)

A primitive value or a function which produces a value.
