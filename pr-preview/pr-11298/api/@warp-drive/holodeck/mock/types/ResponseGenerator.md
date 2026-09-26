---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/holodeck/mock/types/ResponseGenerator.md
description: >-
  Function passed to the Holodeck mock helpers that builds the response body,
  called only when recording a fixture.
---

# &#x20;ResponseGenerator

```ts
type ResponseGenerator = () => Record<string, unknown>;
```

Defined in: [mock.ts:51](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/packages/holodeck/src/mock.ts#L51)

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>
