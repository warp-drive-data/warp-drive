---
url: /api/@warp-drive/core/types/identifier/interfaces/PersistedResourceKey.md
---

# &#x20;PersistedResourceKey\<T>

Defined in: [warp-drive-packages/core/src/types/identifier.ts:94](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/identifier.ts#L94)

Used when a ResourceKey was not created locally as part
of a call to store.createRecord

Distinguishing between this ResourceKey and one for a client created
resource that was created with an ID is generally speaking not possible
at runtime, so anything with an ID typically narrows to this.

## Extends

* `ResourceKeyBase`<`T`>

## Type Parameters

### T

`T` *extends* `string` = `string`

## Properties

### id

```ts
id: string;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:100](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/identifier.ts#L100)

the PrimaryKey for the resource this ResourceKey represents.

***

### lid

```ts
lid: string;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:68](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/identifier.ts#L68)

A string representing a unique identity.

#### Inherited from

```ts
ResourceKeyBase.lid
```

***

### type

```ts
type: T;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:75](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/identifier.ts#L75)

the primary `ResourceType` or "model name" this ResourceKey belongs to.

#### Inherited from

```ts
ResourceKeyBase.type
```
