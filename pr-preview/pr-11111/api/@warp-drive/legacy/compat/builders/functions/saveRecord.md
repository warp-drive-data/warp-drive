---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/legacy/compat/builders/functions/saveRecord.md
---

&#x20;

# &#x20;~~saveRecord()~~&#x20;

```ts
function saveRecord<T>(record, options?): SaveRecordRequestInput<TypeFromInstance<T>, T>;
```

Defined in: [warp-drive-packages/legacy/src/compat/builders/save-record.ts:46](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/compat/builders/save-record.ts#L46)

This function builds a request config for saving the given record (e.g. creating, updating, or deleting the record).
When passed to `store.request`, this config will result in the same behavior as a legacy `store.saveRecord` request.
Additionally, it takes the same options as `store.saveRecord`.

All `@ember-data/legacy-compat` builders exist to enable you to migrate your codebase to using the correct syntax for `store.request` while temporarily preserving legacy behaviors.
This is useful for quickly upgrading an entire app to a unified syntax while a longer incremental migration is made to shift off of adapters and serializers.
To that end, these builders are deprecated and will be removed in a future version of Ember Data.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](../../../../core/types/record/interfaces/TypedRecordInstance.md)

## Parameters

### record

`T`

a record to save

### options?

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`> = `{}`

optional, may include `adapterOptions` hash which will be passed to adapter.saveRecord

## Returns

`SaveRecordRequestInput`<[`TypeFromInstance`](../../../../core/types/record/type-aliases/TypeFromInstance.md)<`T`>, `T`>

request config

## Deprecated
