---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/utilities/interfaces/UpdateRecordUrlOptions.md
---

# &#x20;UpdateRecordUrlOptions

Defined in: [index.ts:321](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L321)

[buildBaseURL](../functions/buildBaseURL.md) options for an `updateRecord` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:346](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L346)

Overrides the globally configured host for this call only.

***

### identifier

```ts
identifier: object;
```

Defined in: [index.ts:329](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L329)

The type and id of the record being updated.

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

Defined in: [index.ts:350](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L350)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "updateRecord";
```

Defined in: [index.ts:325](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L325)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:342](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L342)

The path segment for the resource, defaults to `identifier.type` if not provided.
