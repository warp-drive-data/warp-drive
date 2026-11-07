---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/experiments/storage/functions/BooleanParam.md
description: >-
  Experimental helper that creates a query-param config serializing a boolean
  field as '1' when true and omitting it when false.
---

&#x20;

# &#x20;BooleanParam()

```ts
function BooleanParam(): ParamConfig;
```

Defined in: [warp-drive-packages/experiments/src/storage/query-params.ts:49](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/experiments/src/storage/query-params.ts#L49)

Creates a [ParamConfig](../types/ParamConfig.md) for boolean fields that serialize to '1' or null.

## Returns

[`ParamConfig`](../types/ParamConfig.md)

ParamConfig for boolean fields

## Example

```ts
@param(BooleanParam())
@field
myFlag: boolean = false;
```
