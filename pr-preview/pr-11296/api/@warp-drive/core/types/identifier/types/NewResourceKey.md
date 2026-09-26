---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@warp-drive/core/types/identifier/types/NewResourceKey.md
description: >-
  Resource key for a record created locally with `store.createRecord`, whose
  `id` may still be `null`.
---

# &#x20;NewResourceKey\<T *extends* `string` = `string`>

```ts
interface NewResourceKey<T extends string = string> extends ResourceKeyBase<T> {
  id: string | null;
  lid: string;
  type: T;
}
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:135](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/core/src/types/identifier.ts#L135)

Used when a ResourceKey was created locally
(by a call to store.createRecord).

It is possible in rare circumstances to have a ResourceKey
that is not for a new record but does not have an ID. This would
happen if a user intentionally created one for use with a secondary-index
prior to the record having been fully loaded.

## Extends

* `ResourceKeyBase`<`T`>

## Type Parameters

### T

`T` *extends* `string` = `string`

## Properties

### id

```ts
id: string | null;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:142](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/core/src/types/identifier.ts#L142)

the PrimaryKey for the resource this ResourceKey represents. `null`
if not yet assigned a PrimaryKey value.

***

### lid

```ts
lid: string;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:81](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/core/src/types/identifier.ts#L81)

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

Defined in: [warp-drive-packages/core/src/types/identifier.ts:88](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/core/src/types/identifier.ts#L88)

the primary `ResourceType` or "model name" this ResourceKey belongs to.

#### Inherited from

```ts
ResourceKeyBase.type
```
