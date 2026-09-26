---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/react/variables/WatcherContext.md
description: >-
  React context holding the signal watcher that the nearest `ReactiveContext`
  uses to track which WarpDrive signals its children read.
---

# &#x20;WatcherContext

```ts
const WatcherContext: Context<
  | {
  watcher: Signal.subtle.Watcher;
}
| null>;
```

Defined in: [-private/reactive-context.tsx:156](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/react/src/-private/reactive-context.tsx#L156)
