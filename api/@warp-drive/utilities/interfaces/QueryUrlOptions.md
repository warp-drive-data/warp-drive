---
url: /api/@warp-drive/utilities/interfaces/QueryUrlOptions.md
---

# &#x20;QueryUrlOptions

Defined in: [index.ts:137](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L137)

[buildBaseURL](../functions/buildBaseURL.md) options for a `query` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:158](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L158)

Overrides the globally configured host for this call only.

***

### identifier

```ts
identifier: object;
```

Defined in: [index.ts:145](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L145)

The type of the records to query.

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

Defined in: [index.ts:162](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L162)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "query";
```

Defined in: [index.ts:141](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L141)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:154](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L154)

The path segment for the resource, defaults to `identifier.type` if not provided.
