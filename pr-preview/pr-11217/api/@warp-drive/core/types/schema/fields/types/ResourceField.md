---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/types/schema/fields/types/ResourceField.md
---

# &#x20;ResourceField

```ts
interface ResourceField {
  kind: "resource";
  name: string;
  options?: { as?: string; async?: boolean; inverse?: string | null; polymorphic?: boolean };
  sourceKey?: string;
  type: string;
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:1032](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L1032)

Represents a field that is a reference to
another resource.

The value of a `resource` field on a ReactiveResource is a
`ReactiveRelationshipDocument` whose `data` is the related
resource (or `null`), and whose `links` and `meta` mirror the
relationship payload received from the API.

```ts
const user = store.peekRecord<User>('user', '1');
user.bestFriend.data; // User | null | undefined
user.bestFriend.links; // { related: '/users/1/best-friend' }
```

The relationship payload for this field is expected to have the
shape `{ data?: { type, id } | null, links?: Links, meta?: Meta }`.
When `data` is omitted from the payload `doc.data` is `undefined`
and `doc.fetch()` may be used to load the related resource via
the `related` link.

In LegacyMode the relationship is mutable via `doc.data = record`.
In PolarisMode it is immutable unless the parent resource has been
checked out for editing.

## Properties

### kind

```ts
kind: "resource";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:1038](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L1038)

The kind of field this is.

***

### name

```ts
name: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:1045](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L1045)

The name of the field.

***

### options?

```ts
optional options?: {
  as?: string;
  async?: boolean;
  inverse?: string | null;
  polymorphic?: boolean;
};
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:1088](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L1088)

Options for resources are optional. If
not present, all options are presumed
to be falsey

#### as?

```ts
optional as?: string;
```

If this field is satisfying a polymorphic
relationship on another resource, then this
should be set to the trait or abstract type
that this resource implements.

#### async?

```ts
optional async?: boolean;
```

Whether the relationship is async.

For `resource` fields `async` describes what the API
sends for the relationship (see the Relationship
Specification in the manual):

* `true`: every payload for the relationship MUST carry a
  `links` object with a `related` link. `data` may be
  omitted; when present, the referenced resource MUST be
  included in the payload.
* `false` (default): whenever the relationship is present
  in a payload its `data` member MUST be present and the
  referenced resource MUST be included in the payload.
  The relationship SHOULD NOT carry `links`.

Related resources are never fetched automatically.

#### inverse?

```ts
optional inverse?: string | null;
```

The name of the inverse field on the
related resource that points back to
this field on this resource to form a
bidirectional relationship.

If null, the relationship is unidirectional.

#### polymorphic?

```ts
optional polymorphic?: boolean;
```

Whether this field is a polymorphic relationship,
meaning that it can point to multiple types of
resources so long as they implement the trait
or abstract type specified in `type`.

***

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:1069](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L1069)

The name of the field as returned by the API
and inserted into the [Cache](../../../cache/types/Cache.md) if it differs
from [ResourceField.name](#name)

For instance, if the API returns:

```ts
{
  attributes: {
    'first-name': 'Chris'
  }
}
```

But the app desires to use `record.firstName; // 'Chris'`

Then `name` would be set to `'firstName'` and
`sourceKey` would be set to `'first-name'`.

This option is only needed when the value differs from name.

***

### type

```ts
type: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:1079](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L1079)

The name of the resource that this field
refers to. In the case of a polymorphic
relationship, this should be the trait
or abstract type.
