---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/holodeck/functions/mock.md
---

# &#x20;mock()

```ts
function mock(
   owner: object, 
   generate: 
  | LazyScaffold
  | ScaffoldGenerator, 
   isRecording?: boolean
): Promise<void>;
```

Defined in: [index.ts:452](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/packages/holodeck/src/index.ts#L452)

Mock a request by sending the scaffold to the mock server.

## Parameters

### owner

`object`

### generate

| [`LazyScaffold`](../mock/types/LazyScaffold.md)
| [`ScaffoldGenerator`](../mock/types/ScaffoldGenerator.md)

### isRecording?

`boolean`

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
