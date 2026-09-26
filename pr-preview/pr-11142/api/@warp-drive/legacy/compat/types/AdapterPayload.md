---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/legacy/compat/types/AdapterPayload.md
---

&#x20;

# &#x20;AdapterPayload

```ts
type AdapterPayload = 
  | Record<string, unknown>
  | unknown[];
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-adapter-interface.ts:24](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-adapter-interface.ts#L24)

The raw payload shape returned by a legacy adapter's request methods,
prior to being normalized by a [MinimumSerializerInterface](MinimumSerializerInterface.md).
