---
url: /pr-preview/pr-11087/api/@warp-drive/experiments/aql/functions/parseAQL.md
---

&#x20;

# &#x20;parseAQL()

```ts
function parseAQL(aql, schemas): Promise<PersistedAQLQuery>;
```

Defined in: [aql/parse.ts:319](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/experiments/src/aql/parse.ts#L319)

Parses `.aql` source text into the JSON:API `QUERY` extension's persisted-query
envelope, resolving field/relationship references against `schemas`.

## Parameters

### aql

`string`

### schemas

[`Schemas`](../type-aliases/Schemas.md)

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`PersistedAQLQuery`](../interfaces/PersistedAQLQuery.md)>
