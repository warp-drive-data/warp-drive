---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/schema/fields/types/AttrOptions.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:10](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/schema/fields.ts#L10)

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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:14](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/schema/fields.ts#L14)

A primitive value or a function which produces a value.
