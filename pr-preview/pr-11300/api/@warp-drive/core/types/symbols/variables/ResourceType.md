---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/core/types/symbols/variables/ResourceType.md
description: >-
  Alias of the `Type` symbol that a record type can declare to tell WarpDrive
  APIs its resource type for better type inference.
---

# &#x20;ResourceType

```ts
const ResourceType: "___(unique) Symbol($type)" = Type;
```

Defined in: [warp-drive-packages/core/src/types/symbols.ts:77](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/core/src/types/symbols.ts#L77)

Symbol for the type of a resource.

This is an optional feature that can be used by
record implementations to provide a typescript
hint for the type of the resource.

When used, WarpDrive APIs can
take advantage of this to provide better type
safety and intellisense.
