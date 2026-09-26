---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/types/CreateRecordUrlOptions.md
description: >-
  Options passed to `buildBaseURL` to build the collection URL a new record of a
  given type is saved to.
---

# &#x20;CreateRecordUrlOptions

```ts
interface CreateRecordUrlOptions {
  host?: string;
  identifier: { type: string };
  namespace?: string;
  op: "createRecord";
  resourcePath?: string;
}
```

Defined in: [index.ts:300](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/index.ts#L300)

[buildBaseURL](../functions/buildBaseURL.md) options for a `createRecord` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:321](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/index.ts#L321)

Overrides the globally configured host for this call only.

***

### identifier

```ts
identifier: {
  type: string;
};
```

Defined in: [index.ts:308](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/index.ts#L308)

The type of the record being created.

#### type

```ts
type: string;
```

The resource type.

***

### namespace?

```ts
optional namespace?: string;
```

Defined in: [index.ts:325](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/index.ts#L325)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "createRecord";
```

Defined in: [index.ts:304](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/index.ts#L304)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:317](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/index.ts#L317)

The path segment for the resource, defaults to `identifier.type` if not provided.
