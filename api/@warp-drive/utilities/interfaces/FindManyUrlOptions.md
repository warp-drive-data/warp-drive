---
url: /api/@warp-drive/utilities/interfaces/FindManyUrlOptions.md
---

# &#x20;FindManyUrlOptions

Defined in: [index.ts:170](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L170)

[buildBaseURL](../functions/buildBaseURL.md) options for a `findMany` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:195](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L195)

Overrides the globally configured host for this call only.

***

### identifiers

```ts
identifiers: object[];
```

Defined in: [index.ts:178](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L178)

The type and id of each record to find.

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

Defined in: [index.ts:199](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L199)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "findMany";
```

Defined in: [index.ts:174](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L174)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:191](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L191)

The path segment for the resource, defaults to the first identifier's `type` if not provided.
