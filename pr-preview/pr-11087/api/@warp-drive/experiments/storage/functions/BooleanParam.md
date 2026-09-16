---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/experiments/storage/functions/BooleanParam.md
---

&#x20;

# &#x20;BooleanParam()

```ts
function BooleanParam(): ParamConfig;
```

Defined in: [storage/query-params.ts:44](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/experiments/src/storage/query-params.ts#L44)

Creates a [ParamConfig](../interfaces/ParamConfig.md) for boolean fields that serialize to '1' or null.

## Returns

[`ParamConfig`](../interfaces/ParamConfig.md)

ParamConfig for boolean fields

## Example

```ts
@param(BooleanParam())
@field
myFlag: boolean = false;
```
