---
url: /pr-preview/pr-11111/api/@warp-drive/core/types/cache/interfaces/Cache.md
---

# &#x20;Cache

Defined in: [warp-drive-packages/core/src/types/cache.ts:86](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L86)

The interface for WarpDrive Caches.

A Cache handles in-memory storage of Document and Resource
data.

## Methods

### changedAttrs()

```ts
changedAttrs(cacheKey): ChangedAttributesHash;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:416](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L416)

Query the cache for the changed attributes of a resource.

Returns a map of field names to tuples of \[old, new] values

```
{ <field>: [<old>, <new>] }
```

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

[`ChangedAttributesHash`](../type-aliases/ChangedAttributesHash.md)

***

### changedRelationships()

```ts
changedRelationships(cacheKey): Map<string, RelationshipDiff>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:442](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L442)

Query the cache for the changes to relationships of a resource.

Returns a map of relationship names to [RelationshipDiff](../type-aliases/RelationshipDiff.md) objects.

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

[`Map`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)<`string`, [`RelationshipDiff`](../type-aliases/RelationshipDiff.md)>

***

### clientDidCreate()

```ts
clientDidCreate(cacheKey, createArgs?): Record<string, unknown>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:312](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L312)

\[LIFECYCLE] Signal to the cache that a new record has been instantiated on the client

It returns properties from options that should be set on the record during the create
process. This return value behavior is deprecated.

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### createArgs?

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>

#### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>

***

### commitWasRejected()

```ts
commitWasRejected(cacheKey, errors?): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:367](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L367)

\[LIFECYCLE] Signals to the cache that a resource
was update via a save transaction failed.

#### Parameters

##### cacheKey

| [`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)
| [`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)\[]

##### errors?

[`ApiError`](../../spec/error/interfaces/ApiError.md)\[]

#### Returns

`void`

***

### didCommit()

#### Call Signature

```ts
didCommit(cacheKey, result): SingleResourceDataDocument;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:330](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L330)

\[LIFECYCLE] Signals to the cache that a resource
was successfully updated as part of a save transaction.

##### Parameters

###### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

the primary ResourceKey that was operated on

###### result

| [`StructuredDataDocument`](../../request/interfaces/StructuredDataDocument.md)<[`SingleResourceDataDocument`](../../spec/document/interfaces/SingleResourceDataDocument.md)<[`PersistedResourceKey`](../../identifier/interfaces/PersistedResourceKey.md)<`string`>, [`PersistedResourceKey`](../../identifier/interfaces/PersistedResourceKey.md)<`string`>>>
| `null`

a document in the cache format containing any updated data

##### Returns

[`SingleResourceDataDocument`](../../spec/document/interfaces/SingleResourceDataDocument.md)

#### Call Signature

```ts
didCommit(cacheKey, result): SingleResourceDataDocument;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:343](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L343)

\[LIFECYCLE] Signals to the cache that a set of resources
was successfully updated as part of a save transaction that
resulted in a single resource being returned.

##### Parameters

###### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)\[]

the primary ResourceKeys that were operated on

###### result

| [`StructuredDataDocument`](../../request/interfaces/StructuredDataDocument.md)<[`SingleResourceDataDocument`](../../spec/document/interfaces/SingleResourceDataDocument.md)<[`PersistedResourceKey`](../../identifier/interfaces/PersistedResourceKey.md)<`string`>, [`PersistedResourceKey`](../../identifier/interfaces/PersistedResourceKey.md)<`string`>>>
| `null`

a document in the cache format containing any updated data

##### Returns

[`SingleResourceDataDocument`](../../spec/document/interfaces/SingleResourceDataDocument.md)

#### Call Signature

```ts
didCommit(cacheKey, result): CollectionResourceDataDocument;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:356](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L356)

\[LIFECYCLE] Signals to the cache that a set of resources
was successfully updated as part of a save transaction that
resulted in a collection of resources being returned.

##### Parameters

###### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)\[]

the primary ResourceKeys that were operated on

###### result

| [`StructuredDataDocument`](../../request/interfaces/StructuredDataDocument.md)<[`CollectionResourceDataDocument`](../../spec/document/interfaces/CollectionResourceDataDocument.md)<[`PersistedResourceKey`](../../identifier/interfaces/PersistedResourceKey.md)<`string`>>>
| `null`

a document in the cache format containing any updated data

##### Returns

[`CollectionResourceDataDocument`](../../spec/document/interfaces/CollectionResourceDataDocument.md)

***

### diff()

```ts
diff(): Promise<Change[]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:270](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L270)

Generate the list of changes applied to all
record in the store.

Each individual resource or document that has been mutated
should be described as an individual [Change](../change/interfaces/Change.md) entry
in the returned array.

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`Change`](../change/interfaces/Change.md)\[]>

***

### dump()

```ts
dump(): Promise<ReadableStream<unknown>>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:283](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L283)

Serialize the entire contents of the Cache into a Stream
which may be fed back into a new instance of the same Cache
via `cache.hydrate`.

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`ReadableStream`](https://developer.mozilla.org/docs/Web/API/ReadableStream)<`unknown`>>

***

### fork()

```ts
fork(): Promise<Cache>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:248](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L248)

Create a fork of the cache from the current state.

Applications should typically not call this method themselves,
preferring instead to fork at the Store level, which will
utilize this method to fork the cache.

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`Cache`>

***

### getAttr()

```ts
getAttr(cacheKey, field): Value | undefined;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:387](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L387)

Retrieve the data for an attribute from the cache

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### field

`string` | `string`\[]

#### Returns

[`Value`](../../json/raw/type-aliases/Value.md) | `undefined`

***

### getErrors()

```ts
getErrors(cacheKey): ApiError[];
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:505](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L505)

Query the cache for any validation errors applicable to the given resource.

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

[`ApiError`](../../spec/error/interfaces/ApiError.md)\[]

***

### getRelationship()

```ts
getRelationship(
   cacheKey, 
   field, 
   isCollection?
): 
  | ResourceRelationship<ResourceKey>
| CollectionRelationship<ResourceKey>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:469](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L469)

Query the cache for the current state of a relationship property

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### field

`string`

##### isCollection?

`boolean`

#### Returns

| [`ResourceRelationship`](../relationship/interfaces/ResourceRelationship.md)<[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)>
| [`CollectionRelationship`](../relationship/interfaces/CollectionRelationship.md)<[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)>

resource relationship object

***

### getRemoteAttr()

```ts
getRemoteAttr(cacheKey, field): Value | undefined;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:394](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L394)

Retrieve remote state without any local changes for a specific attribute

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### field

`string` | `string`\[]

#### Returns

[`Value`](../../json/raw/type-aliases/Value.md) | `undefined`

***

### getRemoteRelationship()

```ts
getRemoteRelationship(
   cacheKey, 
   field, 
   isCollection?
): 
  | ResourceRelationship<ResourceKey>
| CollectionRelationship<ResourceKey>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:481](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L481)

Query the cache for the server state of a relationship property without any local changes

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### field

`string`

##### isCollection?

`boolean`

#### Returns

| [`ResourceRelationship`](../relationship/interfaces/ResourceRelationship.md)<[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)>
| [`CollectionRelationship`](../relationship/interfaces/CollectionRelationship.md)<[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)>

resource relationship object

***

### hasChangedAttrs()

```ts
hasChangedAttrs(cacheKey): boolean;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:423](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L423)

Query the cache for whether any mutated attributes exist

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`boolean`

***

### hasChangedRelationships()

```ts
hasChangedRelationships(cacheKey): boolean;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:449](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L449)

Query the cache for whether any mutated attributes exist

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`boolean`

***

### hydrate()

```ts
hydrate(stream): Promise<void>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:299](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L299)

hydrate a Cache from a Stream with content previously serialized
from another instance of the same Cache, resolving when hydration
is complete.

This method should expect to be called both in the context of restoring
the Cache during application rehydration after SSR **AND** at unknown
times during the lifetime of an already booted application when it is
desired to bulk-load additional information into the cache. This latter
behavior supports optimizing pre/fetching of data for route transitions
via data-only SSR modes.

#### Parameters

##### stream

[`ReadableStream`](https://developer.mozilla.org/docs/Web/API/ReadableStream)<`unknown`>

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>

***

### isDeleted()

```ts
isDeleted(cacheKey): boolean;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:528](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L528)

Query the cache for whether a given resource is marked as deleted (but not
necessarily persisted yet).

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`boolean`

***

### isDeletionCommitted()

```ts
isDeletionCommitted(cacheKey): boolean;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:536](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L536)

Query the cache for whether a given resource has been deleted and that deletion
has also been persisted.

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`boolean`

***

### isEmpty()

```ts
isEmpty(cacheKey): boolean;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:512](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L512)

Query the cache for whether a given resource has any available data

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`boolean`

***

### isNew()

```ts
isNew(cacheKey): boolean;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:520](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L520)

Query the cache for whether a given resource was created locally and not
yet persisted.

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`boolean`

***

### merge()

```ts
merge(cache): Promise<void>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:258](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L258)

Merge a fork back into a parent Cache.

Applications should typically not call this method themselves,
preferring instead to merge at the Store level, which will
utilize this method to merge the caches.

#### Parameters

##### cache

`Cache`

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>

***

### mutate()

```ts
mutate(mutation): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:132](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L132)

Update the "local" or "current" (unpersisted) state of the Cache

#### Parameters

##### mutation

[`Mutation`](../mutations/type-aliases/Mutation.md)

#### Returns

`void`

***

### patch()

```ts
patch(op): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:125](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L125)

Update the "remote" or "canonical" (persisted) state of the Cache
by merging new information into the existing state.

#### Parameters

##### op

| [`Operation`](../operations/type-aliases/Operation.md)
| [`Operation`](../operations/type-aliases/Operation.md)\[]

the operation(s) to perform

#### Returns

`void`

***

### peek()

#### Call Signature

```ts
peek<T>(cacheKey): T | null;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:164](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L164)

Peek resource data from the Cache.

In development, if the return value
is JSON the return value
will be deep-cloned and deep-frozen
to prevent mutation thereby enforcing cache
Immutability.

This form of peek is useful for implementations
that want to feed raw-data from cache to the UI
or which want to interact with a blob of data
directly from the presentation cache.

An implementation might want to do this because
de-referencing records which read from their own
blob is generally safer because the record does
not require retainining connections to the Store
and Cache to present data on a per-field basis.

This generally takes the place of `getAttr` as
an API and may even take the place of `getRelationship`
depending on implementation specifics, though this
latter usage is less recommended due to the advantages
of the Graph handling necessary entanglements and
notifications for relational data.

##### Type Parameters

###### T

`T` = `unknown`

##### Parameters

###### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)<[`TypeFromInstanceOrString`](../../record/type-aliases/TypeFromInstanceOrString.md)<`T`>>

##### Returns

`T` | `null`

the known resource data, if any

#### Call Signature

```ts
peek(cacheKey): 
  | ResourceDocument
  | null;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:171](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L171)

Peek the Cache for the [document](../../spec/document/type-aliases/ResourceDocument.md) associated with a request.

##### Parameters

###### cacheKey

[`RequestKey`](../../identifier/interfaces/RequestKey.md)

##### Returns

| [`ResourceDocument`](../../spec/document/type-aliases/ResourceDocument.md)
| `null`

the known document data, if any

***

### peekRemoteState()

#### Call Signature

```ts
peekRemoteState<T>(cacheKey): T | null;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:205](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L205)

Peek remote resource data from the Cache.

This will give the data provided from the server without any local changes.

In development, if the return value
is JSON the return value
will be deep-cloned and deep-frozen
to prevent mutation thereby enforcing cache
Immutability.

This form of peek is useful for implementations
that want to feed raw-data from cache to the UI
or which want to interact with a blob of data
directly from the presentation cache.

An implementation might want to do this because
de-referencing records which read from their own
blob is generally safer because the record does
not require retainining connections to the Store
and Cache to present data on a per-field basis.

This generally takes the place of `getAttr` as
an API and may even take the place of `getRelationship`
depending on implementation specifics, though this
latter usage is less recommended due to the advantages
of the Graph handling necessary entanglements and
notifications for relational data.

##### Type Parameters

###### T

`T` = `unknown`

##### Parameters

###### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)<[`TypeFromInstanceOrString`](../../record/type-aliases/TypeFromInstanceOrString.md)<`T`>>

##### Returns

`T` | `null`

the known data, if any

#### Call Signature

```ts
peekRemoteState(cacheKey): 
  | ResourceDocument
  | null;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:214](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L214)

Peek remote [document](../../spec/document/type-aliases/ResourceDocument.md) data for a request from the Cache.

This will give the data provided from the server without any local changes.

##### Parameters

###### cacheKey

[`RequestKey`](../../identifier/interfaces/RequestKey.md)

##### Returns

| [`ResourceDocument`](../../spec/document/type-aliases/ResourceDocument.md)
| `null`

the known document data, if any

***

### peekRequest()

```ts
peekRequest(cacheKey): 
  | StructuredDocument<ResourceDocument>
  | null;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:226](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L226)

Peek the Cache for the existing request data associated with
a cacheable request

This is effectively the reverse of `put` for a request in
that it will return the the request, response, and content
whereas `peek` will return just the `content`.

#### Parameters

##### cacheKey

[`RequestKey`](../../identifier/interfaces/RequestKey.md)

#### Returns

| [`StructuredDocument`](../../request/type-aliases/StructuredDocument.md)<[`ResourceDocument`](../../spec/document/type-aliases/ResourceDocument.md)>
| `null`

***

### put()

```ts
put<T>(doc): ResourceDocument;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:116](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L116)

Cache the response to a request

Unlike `store.push` which has UPSERT
semantics, `put` has `replace` semantics similar to
the `http` method `PUT`

the individually cacheable resource data it may contain
should upsert, but the document data surrounding it should
fully replace any existing information

Note that in order to support inserting arbitrary data
to the cache that did not originate from a request `put`
should expect to sometimes encounter a document with only
a `content` member and therefor must not assume the existence
of `request` and `response` on the document.

#### Type Parameters

##### T

`T`

#### Parameters

##### doc

| [`StructuredDocument`](../../request/type-aliases/StructuredDocument.md)<`T`>
| {
`content`: `T`;
}

#### Returns

[`ResourceDocument`](../../spec/document/type-aliases/ResourceDocument.md)

***

### rollbackAttrs()

```ts
rollbackAttrs(cacheKey): string[];
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:433](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L433)

Tell the cache to discard any uncommitted mutations to attributes

This method is a candidate to become a mutation

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`string`\[]

the names of fields that were restored

***

### rollbackRelationships()

```ts
rollbackRelationships(cacheKey): string[];
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:461](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L461)

Tell the cache to discard any uncommitted mutations to relationships.

This will also discard the change on any appropriate inverses.

This method is a candidate to become a mutation

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`string`\[]

the names of relationships that were restored

***

### setAttr()

```ts
setAttr(
   cacheKey, 
   field, 
   value
): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:403](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L403)

Mutate the data for an attribute in the cache

This method is a candidate to become a mutation

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### field

`string` | `string`\[]

##### value

[`Value`](../../json/raw/type-aliases/Value.md)

#### Returns

`void`

***

### setIsDeleted()

```ts
setIsDeleted(cacheKey, isDeleted): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:498](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L498)

Update the cache state for the given resource to be marked
as locally deleted, or remove such a mark.

This method is a candidate to become a mutation

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### isDeleted

`boolean`

#### Returns

`void`

***

### unloadRecord()

```ts
unloadRecord(cacheKey): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:377](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L377)

\[LIFECYCLE] Signals to the cache that all data for a resource
should be cleared.

This method is a candidate to become a mutation

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

#### Returns

`void`

***

### upsert()

```ts
upsert(
   cacheKey, 
   data, 
   hasRecord
): void | string[];
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:234](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L234)

Push resource data from a remote source into the cache for this ResourceKey

#### Parameters

##### cacheKey

[`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)

##### data

`unknown`

##### hasRecord

`boolean`

#### Returns

`void` | `string`\[]

if `hasRecord` is true then calculated key changes should be returned

***

### willCommit()

```ts
willCommit(cacheKey, context): void;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:320](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L320)

\[LIFECYCLE] Signals to the cache that a resource
will be part of a save transaction.

#### Parameters

##### cacheKey

| [`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)
| [`ResourceKey`](../../identifier/type-aliases/ResourceKey.md)\[]

##### context

[`RequestContext`](../../request/interfaces/RequestContext.md) | `null`

#### Returns

`void`

## Properties

### version

```ts
version: "2";
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:92](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/cache.ts#L92)

The Cache Version that this implementation implements.
