---
url: /pr-preview/pr-11117/api/@warp-drive/holodeck/functions/mock.md
---

# &#x20;mock()

```ts
function mock(
   owner: object, 
   generate: ScaffoldGenerator, 
   isRecording?: boolean
): Promise<void>;
```

Defined in: [index.ts:351](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/packages/holodeck/src/index.ts#L351)

Mock a request by sending the scaffold to the mock server.

## Parameters

### owner

`object`

### generate

[`ScaffoldGenerator`](../mock/types/ScaffoldGenerator.md)

### isRecording?

`boolean`

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
