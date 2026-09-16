---
url: /api/@warp-drive/experiments/storage/functions/BooleanParam.md
---

&#x20;

# &#x20;BooleanParam()

```ts
function BooleanParam(): ParamConfig;
```

Defined in: [storage/query-params.ts:44](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/experiments/src/storage/query-params.ts#L44)

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
