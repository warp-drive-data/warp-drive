---
url: /api/@warp-drive/utilities/types/FindRecordUrlOptions.md
---

# &#x20;FindRecordUrlOptions

Defined in: [index.ts:100](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/utilities/src/index.ts#L100)

[buildBaseURL](../functions/buildBaseURL.md) options for a `findRecord` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:125](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/utilities/src/index.ts#L125)

Overrides the globally configured host for this call only.

***

### identifier

```ts
identifier: object;
```

Defined in: [index.ts:108](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/utilities/src/index.ts#L108)

The type and id of the record to find.

#### id

```ts
id: string;
```

The resource id.

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

Defined in: [index.ts:129](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/utilities/src/index.ts#L129)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "findRecord";
```

Defined in: [index.ts:104](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/utilities/src/index.ts#L104)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:121](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/utilities/src/index.ts#L121)

The path segment for the resource, defaults to `identifier.type` if not provided.
