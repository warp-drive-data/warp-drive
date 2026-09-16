---
url: /api/@warp-drive/utilities/interfaces/CreateRecordUrlOptions.md
---

# &#x20;CreateRecordUrlOptions

Defined in: [index.ts:288](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L288)

[buildBaseURL](../functions/buildBaseURL.md) options for a `createRecord` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:309](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L309)

Overrides the globally configured host for this call only.

***

### identifier

```ts
identifier: object;
```

Defined in: [index.ts:296](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L296)

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

Defined in: [index.ts:313](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L313)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "createRecord";
```

Defined in: [index.ts:292](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L292)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:305](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/utilities/src/index.ts#L305)

The path segment for the resource, defaults to `identifier.type` if not provided.
