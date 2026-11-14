---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/alien-signals/primitives/functions/isTracking.md
description: Whether a memo is computing, so that signals read now become its dependencies.
---

# &#x20;isTracking()&#x20;

```ts
function isTracking(): boolean;
```

Defined in: [primitives.ts:360](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/alien-signals/src/primitives.ts#L360)

Whether a memo's function is running, which means any signal or memo read now becomes one of
its dependencies.

A framework integration can use this to skip work for reads it doesn't need to observe
directly: when a watched memo reads a signal, the watcher already learns about changes to that
signal through the memo.

## Returns

`boolean`

true while a memo's function is running

## Example

```ts
import { consumeSignal, isTracking } from '@warp-drive/alien-signals/primitives';

function consume(signal) {
  if (!isTracking()) watchInCurrentComponent(signal);
  consumeSignal(signal);
}
```
