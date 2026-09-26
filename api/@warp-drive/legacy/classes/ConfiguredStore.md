---
url: https://canary.warp-drive.io/api/@warp-drive/legacy/classes/ConfiguredStore.md
---

&#x20;

# &#x20;ConfiguredStore\<T *extends* { `cache`: `Cache`; }>

Defined in: [warp-drive-packages/legacy/src/index.ts:170](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/legacy/src/index.ts#L170)

## Extends

* `Store$1`

## Type Parameters

### T

`T` *extends* {
`cache`: `Cache`;
}

## Indexable

```ts
[key: string]: any
```

## Methods

### createCache()

```ts
createCache(capabilities: CacheCapabilitiesManager$1): T["cache"];
```

Defined in: [warp-drive-packages/legacy/src/index.ts:179](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/legacy/src/index.ts#L179)

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
