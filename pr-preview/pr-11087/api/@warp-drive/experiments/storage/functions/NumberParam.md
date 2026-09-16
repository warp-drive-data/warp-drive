---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/experiments/storage/functions/NumberParam.md
---

&#x20;

# &#x20;NumberParam()

```ts
function NumberParam(precision?, getDefault?): ParamConfig;
```

Defined in: [storage/query-params.ts:65](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/experiments/src/storage/query-params.ts#L65)

Creates a [ParamConfig](../interfaces/ParamConfig.md) for numeric fields with default value checking.

## Parameters

### precision?

`number`

When given, the number of digits to serialize after the decimal point

### getDefault?

(`instance`) => `number` | `undefined`

Function to get the default value for comparison

## Returns

[`ParamConfig`](../interfaces/ParamConfig.md)

ParamConfig for number fields

## Example

```ts
@param(NumberParam(2, function (instance: MyClass) { return instance.defaultZoom; }))
@field
zoom: number = 12;
```
