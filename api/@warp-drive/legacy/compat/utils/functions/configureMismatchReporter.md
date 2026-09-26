---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/utils/functions/configureMismatchReporter.md
description: >-
  Legacy migration helper that registers a callback invoked whenever
  `formattedId` or `formattedType` has to change the id or type it was given.
---

&#x20;

# &#x20;configureMismatchReporter()

```ts
function configureMismatchReporter(fn: Reporter): void;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:45](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/legacy/src/compat/utils.ts#L45)

Configure a function to be called when an id or type
changes during normalization. This is useful for instrumenting
to discover places where usage in the app is not consistent.

## Parameters

### fn

`Reporter`

a function which takes a mismatch-type ('formatted-id' | 'formatted-type'), actual, and expected value

## Returns

`void`
