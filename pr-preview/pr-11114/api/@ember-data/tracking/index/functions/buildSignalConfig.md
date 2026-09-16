---
url: >-
  /pr-preview/pr-11114/api/@ember-data/tracking/index/functions/buildSignalConfig.md
---

# &#x20;~~buildSignalConfig()~~&#x20;

```ts
function buildSignalConfig(options): object;
```

Defined in: [index.ts:90](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/packages/tracking/src/index.ts#L90)

Creates a signal configuration object for WarpDrive that integrates with Ember's
reactivity system. This will be automatically imported and registered by
`@ember-data/store` if the deprecation has not been resolved.

This function should not be called directly in your application code
and this package is deprecated entirely. Use [@warp-drive/ember](../../../../@warp-drive/ember/index.md)
instead.

## Parameters

### options

#### wellknown

{
`Array`: `string` | `symbol`;
}

#### wellknown.Array

`string` | `symbol`

## Returns

`object`

### ~~createMemo~~

```ts
createMemo: <F>(object, key, fn) => () => F;
```

#### Type Parameters

##### F

`F`

#### Parameters

##### object

`object`

##### key

`string` | `symbol`

##### fn

() => `F`

#### Returns

() => `F`

### ~~waitFor~~

```ts
waitFor: <K>(promise) => Promise<K>;
```

#### Type Parameters

##### K

`K`

#### Parameters

##### promise

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`K`>

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`K`>

### ~~willSyncFlushWatchers~~

```ts
willSyncFlushWatchers: () => boolean;
```

#### Returns

`boolean`

### ~~consumeSignal()~~

```ts
consumeSignal(signal): void;
```

#### Parameters

##### signal

`Tag` | \[`Tag`, `Tag`, `Tag`]

#### Returns

`void`

### ~~createSignal()~~

```ts
createSignal(obj, key): Tag | [Tag, Tag, Tag];
```

#### Parameters

##### obj

`object`

##### key

`string` | `symbol`

#### Returns

`Tag` | \[`Tag`, `Tag`, `Tag`]

### ~~notifySignal()~~

```ts
notifySignal(signal): void;
```

#### Parameters

##### signal

`Tag` | \[`Tag`, `Tag`, `Tag`]

#### Returns

`void`

## Deprecated
