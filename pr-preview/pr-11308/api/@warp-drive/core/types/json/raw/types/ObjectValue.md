---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/types/json/raw/types/ObjectValue.md
description: A plain JSON object whose property values are all JSON values.
---

# &#x20;ObjectValue

```ts
interface ObjectValue {
  [key: string]: Value;
}
```

Defined in: [warp-drive-packages/core/src/types/json/raw.ts:20](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/types/json/raw.ts#L20)

A plain JSON object, whose values are themselves valid [Value](Value.md)s.

## Indexable

```ts
[key: string]: Value
```
