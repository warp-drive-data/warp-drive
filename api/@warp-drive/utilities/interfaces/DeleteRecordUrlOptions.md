---
url: /api/@warp-drive/utilities/interfaces/DeleteRecordUrlOptions.md
---

# &#x20;DeleteRecordUrlOptions

Defined in: [index.ts:358](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/utilities/src/index.ts#L358)

[buildBaseURL](../functions/buildBaseURL.md) options for a `deleteRecord` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:383](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/utilities/src/index.ts#L383)

Overrides the globally configured host for this call only.

***

### identifier

```ts
identifier: object;
```

Defined in: [index.ts:366](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/utilities/src/index.ts#L366)

The type and id of the record being deleted.

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

Defined in: [index.ts:387](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/utilities/src/index.ts#L387)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "deleteRecord";
```

Defined in: [index.ts:362](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/utilities/src/index.ts#L362)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:379](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/utilities/src/index.ts#L379)

The path segment for the resource, defaults to `identifier.type` if not provided.
