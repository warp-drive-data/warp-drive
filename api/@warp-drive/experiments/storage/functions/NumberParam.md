---
url: /api/@warp-drive/experiments/storage/functions/NumberParam.md
---

&#x20;

# &#x20;NumberParam()

```ts
function NumberParam(precision?: number, getDefault?: (instance: any) => number | undefined): ParamConfig;
```

Defined in: [storage/query-params.ts:65](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/experiments/src/storage/query-params.ts#L65)

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
