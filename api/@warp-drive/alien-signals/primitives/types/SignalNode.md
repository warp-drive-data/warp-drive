---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/alien-signals/primitives/types/SignalNode.md
description: >-
  The opaque node returned by `createSignal`, which tracks the memos and
  watchers that consumed it.
---

# &#x20;SignalNode

```ts
interface SignalNode extends ReactiveNode {}
```

Defined in: [primitives.ts:55](https://github.com/warp-drive-data/warp-drive/blob/61394c6234e8cd5b736138b64ac29fdf3ec888d2/warp-drive-packages/alien-signals/src/primitives.ts#L55)

A signal created by [createSignal](../functions/createSignal.md). It carries no value: it only records which memos and
watchers depend on it, so that [notifySignal](../functions/notifySignal.md) can tell them the value it guards changed.

Its fields belong to the graph and must not be read or written directly.

## Extends

* `ReactiveNode`
