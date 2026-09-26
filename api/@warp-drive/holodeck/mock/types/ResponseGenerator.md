---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/holodeck/mock/types/ResponseGenerator.md
description: >-
  Function passed to the Holodeck mock helpers that builds the response body,
  called only when recording a fixture.
---

# &#x20;ResponseGenerator

```ts
type ResponseGenerator = () => Record<string, unknown>;
```

Defined in: [mock.ts:51](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/packages/holodeck/src/mock.ts#L51)

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>
