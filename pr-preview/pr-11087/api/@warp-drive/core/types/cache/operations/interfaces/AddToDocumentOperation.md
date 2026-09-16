---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/cache/operations/interfaces/AddToDocumentOperation.md
---

# &#x20;AddToDocumentOperation

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:154](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/operations.ts#L154)

Adds a resource to a request document, optionally
at a specific index. This can be used to update the
result of a request.

## Extends

* [`Op`](Op.md)

## Properties

### field

```ts
field: "data" | "included";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:163](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/operations.ts#L163)

Which member of the document to add to

***

### index?

```ts
optional index?: number;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:171](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/operations.ts#L171)

The index at which to insert the resource(s), if applicable

***

### op

```ts
op: "add";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:155](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/operations.ts#L155)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: RequestKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:159](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/operations.ts#L159)

The cache key for the request document

***

### value

```ts
value: 
  | PersistedResourceKey<string>
  | PersistedResourceKey<string>[];
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:167](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/operations.ts#L167)

The resource(s) to add
