---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/holodeck/functions/mock.md
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

Defined in: [index.ts:452](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/packages/holodeck/src/index.ts#L452)

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
