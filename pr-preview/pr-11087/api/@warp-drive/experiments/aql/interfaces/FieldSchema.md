---
url: /pr-preview/pr-11087/api/@warp-drive/experiments/aql/interfaces/FieldSchema.md
---

&#x20;

# &#x20;FieldSchema

Defined in: [aql/parse.ts:8](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/experiments/src/aql/parse.ts#L8)

Compiles `.aql` (Abstract Query Language) source text into the persisted-query
envelope described by the JSON:API `QUERY` extension (`q:id`/`q:type`/`q:search`).

See `./README.md` for the language grammar and worked examples.

## Properties

### kind

```ts
kind: "object" | "attribute" | "resource" | "collection" | "derived" | "array";
```

Defined in: [aql/parse.ts:11](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/experiments/src/aql/parse.ts#L11)

***

### name

```ts
name: string;
```

Defined in: [aql/parse.ts:10](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/experiments/src/aql/parse.ts#L10)

***

### options?

```ts
optional options?: Record<string, unknown>;
```

Defined in: [aql/parse.ts:12](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/experiments/src/aql/parse.ts#L12)

***

### type

```ts
type: string | null;
```

Defined in: [aql/parse.ts:9](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/experiments/src/aql/parse.ts#L9)
