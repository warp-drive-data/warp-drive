---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/experiments/storage/interfaces/ReactiveStorage.md
---

&#x20;

# &#x20;ReactiveStorage

Defined in: [storage/storage.ts:143](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L143)

A reactive wrapper around the Web Storage API (localStorage/sessionStorage)
that provides signal-based access to storage items and length.

Will automatically update when storage events occur in other tabs/windows.

## Implements

* [`Storage`](https://developer.mozilla.org/docs/Web/API/Storage)

## Methods

### clear()

```ts
clear(): void;
```

Defined in: [storage/storage.ts:334](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L334)

Clears all keys from Storage, triggering reactivity

#### Returns

`void`

#### Implementation of

```ts
Storage.clear
```

***

### getItem()

```ts
getItem(key): string | null;
```

Defined in: [storage/storage.ts:228](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L228)

Reactive access to Storage contents

#### Parameters

##### key

`string`

#### Returns

`string` | `null`

#### Implementation of

```ts
Storage.getItem
```

***

### key()

```ts
key(index): string | null;
```

Defined in: [storage/storage.ts:349](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L349)

Reactive access to the key at the given index

#### Parameters

##### index

`number`

#### Returns

`string` | `null`

#### Implementation of

```ts
Storage.key
```

***

### peekItem()

```ts
peekItem(key): string | null;
```

Defined in: [storage/storage.ts:206](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L206)

Non-reactive way to peek the current value of a key in Storage

#### Parameters

##### key

`string`

#### Returns

`string` | `null`

***

### removeItem()

```ts
removeItem(key): void;
```

Defined in: [storage/storage.ts:312](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L312)

Remove a value from Storage, triggering reactivity

#### Parameters

##### key

`string`

#### Returns

`void`

#### Implementation of

```ts
Storage.removeItem
```

***

### setEffect()

```ts
setEffect(key, fn): void;
```

Defined in: [storage/storage.ts:153](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L153)

#### Parameters

##### key

`string`

##### fn

(`value`) => `void`

#### Returns

`void`

***

### setItem()

```ts
setItem(key, value): void;
```

Defined in: [storage/storage.ts:253](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L253)

Set a value in Storage, triggering reactivity

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`void`

#### Implementation of

```ts
Storage.setItem
```

## Properties

### length

#### Get Signature

```ts
get length(): number;
```

Defined in: [storage/storage.ts:199](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage.ts#L199)

Reactive access to the number of keys in Storage

##### Returns

`number`

#### Implementation of

```ts
Storage.length
```
