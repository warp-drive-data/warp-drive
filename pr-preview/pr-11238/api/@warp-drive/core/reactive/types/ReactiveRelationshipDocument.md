---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/reactive/types/ReactiveRelationshipDocument.md
---

# &#x20;ReactiveRelationshipDocument\<T>

```ts
interface ReactiveRelationshipDocument<T> {
  data: T | undefined;
  readonly identifier: null;
  readonly isDirty: boolean;
  readonly links?: 
  | Links
  | PaginationLinks;
  readonly meta?: ObjectValue;
  readonly remoteData: T | undefined;
  fetch(options?: RequestInfo<unknown>): Promise<unknown>;
  toJSON(): object;
}
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:75](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L75)

The reactive document produced for a `resource` or `collection`
relationship field on a [ReactiveResource](ReactiveResource.md).

```ts
const user = store.peekRecord<User>('user', '1');

user.bestFriend.data;  // User | null | undefined
user.bestFriend.links; // { related: '/users/1/best-friend' }
user.bestFriend.meta;  // { ... }

user.friends.data;     // User[] | undefined
```

`data` is a reactive view of the relationship's membership in the cache.
For an immutable (PolarisMode) resource it reflects the remote state; for
an editable resource (LegacyMode, or a resource that has been checked out
for editing) it reflects the local state, including unsaved changes.

`links` and `meta` are server-owned and **always** reflect the last
payload received from the API, on editable and immutable resources alike.
They are never changed by local mutations, so `meta` derived from
membership (e.g. a `count`) becomes stale while the relationship has
unsaved changes. Use [isDirty](#isdirty)
and [remoteData](#remotedata) to
detect and reason about that drift.

`data` is `undefined` when the relationship payload did not include a
`data` member (e.g. a links-only payload for an async relationship);
`null` (resource) or an empty array (collection) mean the relationship
is known to be empty. Use [fetch](#fetch)
to load the related data via the relationship's `related` link.

When the owning resource is editable the relationship may be mutated
through `data`:

```ts
editableUser.bestFriend.data = otherUser; // or null
editableUser.friends.data.push(otherUser);
editableUser.friends.data = [a, b];
```

Assigning to the field itself (`user.bestFriend = x`) is never allowed.

Collection relationships are not paginated: pagination links present on
the relationship are surfaced on `links` but never merged into `data`.

When serializing a relationship for a request, send only the identifiers
of `data`; `links` and `meta` describe the server's view and must not be
echoed back to it.

## Type Parameters

### T

`T`

## Methods

### fetch()

```ts
fetch(options?: RequestInfo<unknown>): Promise<unknown>;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:147](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L147)

Fetches the related link for this relationship (falling back to the
self link), returning a promise that resolves with the response
document when the request completes.

The response is a top-level document; it is not merged into the
relationship's membership.

#### Parameters

##### options?

[`RequestInfo`](../../types/request/types/RequestInfo.md)<`unknown`>

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`unknown`>

***

### toJSON()

```ts
toJSON(): object;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:158](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L158)

Implemented for `JSON.stringify` support.

This is a shallow serialization of the document's shape (`data`, `links`,
`meta`), not a request payload: when serializing the relationship for a
request, send only the identifiers of `data`.

#### Returns

`object`

## Properties

### data

```ts
data: T | undefined;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:84](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L84)

The related resource(s). `undefined` when the relationship has not
received membership data.

Assignable when the owning resource is editable.

***

### identifier

```ts
readonly identifier: null;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:135](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L135)

Relationship documents are not request documents and so
have no RequestKey.

***

### isDirty

```ts
readonly isDirty: boolean;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:106](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L106)

Whether the relationship has local changes that have not yet been
confirmed by the API. When `true`, `links` and `meta` describe the
remote membership (`remoteData`), not the local one (`data`).

***

### links?

```ts
readonly optional links?: 
  | Links
  | PaginationLinks;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:116](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L116)

The links object for this relationship, if any.

Server-owned: always reflects the last payload received from the API
and is never affected by local mutations.

***

### meta?

```ts
readonly optional meta?: ObjectValue;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:127](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L127)

The meta object for this relationship, if any.

Server-owned: always reflects the last payload received from the API
and is never affected by local mutations. Values derived from membership
(such as a `count`) are stale while `isDirty` is `true`.

***

### remoteData

```ts
readonly remoteData: T | undefined;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts:97](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/reactive/-private/fields/relationship-document.ts#L97)

The related resource(s) as last confirmed by the API, ignoring any
unsaved local changes. On an immutable resource this is the same as
`data`; on an editable resource it lets you compare the local
membership against the remote one (e.g. to render "3 of 100" from
`meta.count` honestly while the relationship is being edited).

`undefined` when the relationship has not received membership data.
