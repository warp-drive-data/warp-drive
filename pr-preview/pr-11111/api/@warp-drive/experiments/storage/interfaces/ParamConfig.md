---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/experiments/storage/interfaces/ParamConfig.md
---

&#x20;

# &#x20;ParamConfig

Defined in: [storage/query-params.ts:9](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/experiments/src/storage/query-params.ts#L9)

Configuration options for fields that are also query parameters

## Properties

### deserialize

```ts
deserialize: (urlValue, instance) => unknown;
```

Defined in: [storage/query-params.ts:19](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/experiments/src/storage/query-params.ts#L19)

Convert a string value from the URL back into
its original type

#### Parameters

##### urlValue

`string`

##### instance

`any`

#### Returns

`unknown`

***

### getDefault?

```ts
optional getDefault?: (instance) => unknown;
```

Defined in: [storage/query-params.ts:29](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/experiments/src/storage/query-params.ts#L29)

Get the default value for this param from the given instance.

If not present, the value passed to the field initializer
will be used as the default.

This should return the value in the field's native type,
not the serialized URL form.

#### Parameters

##### instance

`any`

#### Returns

`unknown`

***

### serialize

```ts
serialize: (value, instance) => string | null;
```

Defined in: [storage/query-params.ts:14](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/experiments/src/storage/query-params.ts#L14)

Convert a value into a string for storage in the URL.
`null` indicates the value should be omitted from the URL.

#### Parameters

##### value

`unknown`

##### instance

`any`

#### Returns

`string` | `null`
