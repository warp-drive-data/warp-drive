---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/alien-signals/primitives/types/SignalNode.md
description: >-
  The opaque node returned by `createSignal`, which tracks the memos and
  watchers that consumed it.
---

# &#x20;SignalNode

```ts
interface SignalNode extends ReactiveNode {}
```

Defined in: [primitives.ts:55](https://github.com/warp-drive-data/warp-drive/blob/29ab359ab5e9593db23fe661b989f7544558d789/warp-drive-packages/alien-signals/src/primitives.ts#L55)

A signal created by [createSignal](../functions/createSignal.md). It carries no value: it only records which memos and
watchers depend on it, so that [notifySignal](../functions/notifySignal.md) can tell them the value it guards changed.

Its fields belong to the graph and must not be read or written directly.

## Extends

* `ReactiveNode`
