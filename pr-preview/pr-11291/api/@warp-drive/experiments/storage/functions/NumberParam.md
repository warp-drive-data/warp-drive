---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/experiments/storage/functions/NumberParam.md
---

&#x20;

# &#x20;NumberParam()

```ts
function NumberParam(precision?: number, getDefault?: (instance: any) => number | undefined): ParamConfig;
```

Defined in: [warp-drive-packages/experiments/src/storage/query-params.ts:65](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/experiments/src/storage/query-params.ts#L65)

Creates a [ParamConfig](../types/ParamConfig.md) for numeric fields with default value checking.

## Parameters

### precision?

`number`

When given, the number of digits to serialize after the decimal point

### getDefault?

(`instance`: `any`) => `number` | `undefined`

Function to get the default value for comparison

## Returns

[`ParamConfig`](../types/ParamConfig.md)

ParamConfig for number fields

## Example

```ts
@param(NumberParam(2, function (instance: MyClass) { return instance.defaultZoom; }))
@field
zoom: number = 12;
```
