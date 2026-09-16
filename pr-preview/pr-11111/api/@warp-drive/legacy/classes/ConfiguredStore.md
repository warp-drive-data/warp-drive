---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/legacy/classes/ConfiguredStore.md
---

&#x20;

# &#x20;ConfiguredStore\<T>

Defined in: [warp-drive-packages/legacy/src/index.ts:159](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/legacy/src/index.ts#L159)

## Extends

* `Store$1`

## Type Parameters

### T

`T` *extends* `object`

## Indexable

```ts
[key: string]: any
```

## Methods

### createCache()

```ts
createCache(capabilities): T["cache"];
```

Defined in: [warp-drive-packages/legacy/src/index.ts:168](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/legacy/src/index.ts#L168)

Instantiation hook allowing applications or addons to configure the store
to utilize a custom Cache implementation.

This hook should not be called directly by consuming applications or libraries.
Use `Store.cache` to access the Cache instance.

#### Parameters

##### capabilities

`CacheCapabilitiesManager$1`

#### Returns

`T`\[`"cache"`]

#### Overrides

```ts
Store.createCache
```
