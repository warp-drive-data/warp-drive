---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/legacy/compat/functions/adapterFor.md
---

&#x20;

# &#x20;adapterFor()

## Call Signature

```ts
function adapterFor(this, modelName): MinimumAdapterInterface;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:99](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/legacy/src/compat.ts#L99)

Returns an instance of the adapter for a given type. For
example, `adapterFor('person')` will return an instance of
the adapter located at `app/adapters/person.js`

If no `person` adapter is found, this method will look
for an `application` adapter (the default adapter for
your entire application).

### Parameters

#### this

`Store$1`

#### modelName

`string`

### Returns

[`MinimumAdapterInterface`](../interfaces/MinimumAdapterInterface.md)

## Call Signature

```ts
function adapterFor(
   this, 
   modelName, 
   _allowMissing
): 
  | MinimumAdapterInterface
  | undefined;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:100](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/legacy/src/compat.ts#L100)

Returns an instance of the adapter for a given type. For
example, `adapterFor('person')` will return an instance of
the adapter located at `app/adapters/person.js`

If no `person` adapter is found, this method will look
for an `application` adapter (the default adapter for
your entire application).

### Parameters

#### this

`Store$1`

#### modelName

`string`

#### \_allowMissing

`true`

### Returns

| [`MinimumAdapterInterface`](../interfaces/MinimumAdapterInterface.md)
| `undefined`
