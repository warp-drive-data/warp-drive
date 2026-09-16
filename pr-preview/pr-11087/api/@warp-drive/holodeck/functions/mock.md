---
url: /pr-preview/pr-11087/api/@warp-drive/holodeck/functions/mock.md
---

# &#x20;mock()

```ts
function mock(
   owner, 
   generate, 
   isRecording?
): Promise<void>;
```

Defined in: [index.ts:351](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/packages/holodeck/src/index.ts#L351)

Mock a request by sending the scaffold to the mock server.

## Parameters

### owner

`object`

### generate

[`ScaffoldGenerator`](../mock/type-aliases/ScaffoldGenerator.md)

### isRecording?

`boolean`

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
