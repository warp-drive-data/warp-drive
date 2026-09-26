---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/graph/types/Operation.md
---

# &#x20;Operation

```ts
interface Operation {
  op: string;
}
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:18](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/graph.ts#L18)

All Graph operations are objects with at least one property,
`op`, which contains a string with the name of the operation
to perform.

## Properties

### op

```ts
op: string;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:22](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/graph.ts#L22)

The name of the operation
