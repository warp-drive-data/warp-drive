---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/legacy/adapter/error/types/AdapterRequestErrorConstructor.md
---

&#x20;

# &#x20;AdapterRequestErrorConstructor\<Instance *extends* [`AdapterRequestError`](AdapterRequestError.md) = [`AdapterRequestError`](AdapterRequestError.md)>

```ts
interface AdapterRequestErrorConstructor<Instance extends AdapterRequestError = AdapterRequestError> {
  constructor: unknown;
  extend(options: { message: string }): AdapterRequestErrorConstructor;
}
```

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:58](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/legacy/src/adapter/error.ts#L58)

The static interface shared by [AdapterError](../variables/AdapterError.md) and its subclasses,
allowing further subclassing via [extend](#extend).

## Type Parameters

### Instance

`Instance` *extends* [`AdapterRequestError`](AdapterRequestError.md) = [`AdapterRequestError`](AdapterRequestError.md)

## Constructors

### Constructor

```ts
new AdapterRequestErrorConstructor(errors?: unknown[], message?: string): Instance;
```

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:59](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/legacy/src/adapter/error.ts#L59)

#### Parameters

##### errors?

`unknown`\[]

##### message?

`string`

#### Returns

`Instance`

## Methods

### extend()

```ts
extend(options: {
  message: string;
}): AdapterRequestErrorConstructor;
```

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:63](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/legacy/src/adapter/error.ts#L63)

Creates a new AdapterRequestErrorConstructor that inherits from this one.

#### Parameters

##### options

###### message

`string`

#### Returns

`AdapterRequestErrorConstructor`
