---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/identifier/types/PersistedResourceKey.md
description: >-
  Resource key whose `id` is a known string, the form keys for server-loaded
  resources take.
---

# &#x20;PersistedResourceKey\<T *extends* `string` = `string`>

```ts
interface PersistedResourceKey<T extends string = string> extends ResourceKeyBase<T> {
  id: string;
  lid: string;
  type: T;
}
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:109](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/core/src/types/identifier.ts#L109)

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

Defined in: [warp-drive-packages/core/src/types/identifier.ts:115](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/core/src/types/identifier.ts#L115)

the PrimaryKey for the resource this ResourceKey represents.

***

### lid

```ts
lid: string;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:81](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/core/src/types/identifier.ts#L81)

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

Defined in: [warp-drive-packages/core/src/types/identifier.ts:88](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/core/src/types/identifier.ts#L88)

the primary `ResourceType` or "model name" this ResourceKey belongs to.

#### Inherited from

```ts
ResourceKeyBase.type
```
