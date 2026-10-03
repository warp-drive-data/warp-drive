---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/holodeck/functions/mock.md
description: >-
  Registers a mock response with the Holodeck server for the current test,
  recording it as a fixture when recording and only counting it when replaying.
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

Defined in: [index.ts:467](https://github.com/warp-drive-data/warp-drive/blob/ff37f72fbdeb94e94f014e7fffe480e3aae5ae44/packages/holodeck/src/index.ts#L467)

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
