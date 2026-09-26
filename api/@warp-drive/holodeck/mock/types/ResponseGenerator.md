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

Defined in: [mock.ts:51](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/packages/holodeck/src/mock.ts#L51)

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>
