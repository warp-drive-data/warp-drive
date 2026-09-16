---
url: /pr-preview/pr-11117/api/@warp-drive/legacy/classes/ConfiguredStore.md
---

&#x20;

# &#x20;ConfiguredStore\<T *extends* { `cache`: `Cache`; }>

```ts
class ConfiguredStore<T extends { cache: Cache }> extends Store$1;
```

Defined in: [warp-drive-packages/legacy/src/index.ts:159](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/legacy/src/index.ts#L159)

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

Defined in: [warp-drive-packages/legacy/src/index.ts:168](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/legacy/src/index.ts#L168)

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
