---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/types/FindManyUrlOptions.md
description: >-
  Options passed to `buildBaseURL` to build the URL for fetching several
  resources, pathed by the first identifier's type.
---

# &#x20;FindManyUrlOptions

```ts
interface FindManyUrlOptions {
  host?: string;
  identifiers: {
  id: string;
  type: string;
}[];
  namespace?: string;
  op: "findMany";
  resourcePath?: string;
}
```

Defined in: [index.ts:177](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/utilities/src/index.ts#L177)

[buildBaseURL](../functions/buildBaseURL.md) options for a `findMany` request.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:202](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/utilities/src/index.ts#L202)

Overrides the globally configured host for this call only.

***

### identifiers

```ts
identifiers: {
  id: string;
  type: string;
}[];
```

Defined in: [index.ts:185](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/utilities/src/index.ts#L185)

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

Defined in: [index.ts:206](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/utilities/src/index.ts#L206)

Overrides the globally configured namespace for this call only.

***

### op

```ts
op: "findMany";
```

Defined in: [index.ts:181](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/utilities/src/index.ts#L181)

The request operation this URL is for.

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [index.ts:198](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/utilities/src/index.ts#L198)

The path segment for the resource, defaults to the first identifier's `type` if not provided.
