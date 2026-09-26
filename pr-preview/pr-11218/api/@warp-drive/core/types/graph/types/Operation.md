---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/types/graph/types/Operation.md
---

# &#x20;Operation

```ts
interface Operation {
  op: string;
}
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:18](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/types/graph.ts#L18)

All Graph operations are objects with at least one property,
`op`, which contains a string with the name of the operation
to perform.

## Properties

### op

```ts
op: string;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:22](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/types/graph.ts#L22)

The name of the operation
