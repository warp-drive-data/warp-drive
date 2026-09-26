---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/core/types/symbols/variables/ResourceType.md
---

# &#x20;ResourceType

```ts
const ResourceType: "___(unique) Symbol($type)" = Type;
```

Defined in: [warp-drive-packages/core/src/types/symbols.ts:66](https://github.com/warp-drive-data/warp-drive/blob/1a7c85f0c565d334929c0f2dd26023bb9bbcb6f7/warp-drive-packages/core/src/types/symbols.ts#L66)

Symbol for the type of a resource.

This is an optional feature that can be used by
record implementations to provide a typescript
hint for the type of the resource.

When used, WarpDrive APIs can
take advantage of this to provide better type
safety and intellisense.
