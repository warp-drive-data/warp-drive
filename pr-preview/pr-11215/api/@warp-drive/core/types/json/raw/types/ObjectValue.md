---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/json/raw/types/ObjectValue.md
description: A plain JSON object whose property values are all JSON values.
---

# &#x20;ObjectValue

```ts
interface ObjectValue {
  [key: string]: Value;
}
```

Defined in: [warp-drive-packages/core/src/types/json/raw.ts:20](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/core/src/types/json/raw.ts#L20)

A plain JSON object, whose values are themselves valid [Value](Value.md)s.

## Indexable

```ts
[key: string]: Value
```
