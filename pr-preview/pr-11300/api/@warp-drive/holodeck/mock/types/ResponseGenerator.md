---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/holodeck/mock/types/ResponseGenerator.md
description: >-
  Function passed to the Holodeck mock helpers that builds the response body,
  called only when recording a fixture.
---

# &#x20;ResponseGenerator

```ts
type ResponseGenerator = () => Record<string, unknown>;
```

Defined in: [mock.ts:51](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/packages/holodeck/src/mock.ts#L51)

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>
