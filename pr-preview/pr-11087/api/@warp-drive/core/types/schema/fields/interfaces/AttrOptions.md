---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/schema/fields/interfaces/AttrOptions.md
---

# &#x20;AttrOptions

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:10](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/schema/fields.ts#L10)

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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:14](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/schema/fields.ts#L14)

A primitive value or a function which produces a value.
