---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/react/variables/WatcherContext.md
description: >-
  React context holding the signal watcher that the nearest `ReactiveContext`
  uses to track which WarpDrive signals its children read.
---

# &#x20;WatcherContext

```ts
const WatcherContext: Context<
  | {
  watcher: Watcher;
}
| null>;
```

Defined in: [-private/reactive-context.tsx:154](https://github.com/warp-drive-data/warp-drive/blob/cd257a192e0aa00670375a9be6faac263c773237/warp-drive-packages/react/src/-private/reactive-context.tsx#L154)
