---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/legacy/adapter/error/interfaces/AdapterRequestErrorConstructor.md
---

&#x20;

# &#x20;AdapterRequestErrorConstructor\<Instance>

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:58](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/legacy/src/adapter/error.ts#L58)

The static interface shared by [AdapterError](../variables/AdapterError.md) and its subclasses,
allowing further subclassing via [extend](#extend).

## Type Parameters

### Instance

`Instance` *extends* [`AdapterRequestError`](AdapterRequestError.md) = [`AdapterRequestError`](AdapterRequestError.md)

## Constructors

### Constructor

```ts
new AdapterRequestErrorConstructor(errors?, message?): Instance;
```

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:59](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/legacy/src/adapter/error.ts#L59)

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
extend(options): AdapterRequestErrorConstructor;
```

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:63](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/legacy/src/adapter/error.ts#L63)

Creates a new AdapterRequestErrorConstructor that inherits from this one.

#### Parameters

##### options

###### message

`string`

#### Returns

`AdapterRequestErrorConstructor`
