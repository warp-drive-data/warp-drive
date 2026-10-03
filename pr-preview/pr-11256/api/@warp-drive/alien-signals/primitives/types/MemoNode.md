---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/alien-signals/primitives/types/MemoNode.md
description: >-
  The opaque node returned by `createMemo`, which caches a function's result
  until something it read changes.
---

# &#x20;MemoNode\<T = `unknown`>

```ts
interface MemoNode<T = unknown> extends ReactiveNode {}
```

Defined in: [primitives.ts:85](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/alien-signals/src/primitives.ts#L85)

A memo created by [createMemo](../functions/createMemo.md). Read it with [readMemo](../functions/readMemo.md).

Its fields belong to the graph and must not be read or written directly.

## Extends

* `ReactiveNode`

## Type Parameters

### T

`T` = `unknown`
