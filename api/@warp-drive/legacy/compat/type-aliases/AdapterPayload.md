---
url: /api/@warp-drive/legacy/compat/type-aliases/AdapterPayload.md
---

&#x20;

# &#x20;AdapterPayload

```ts
type AdapterPayload = 
  | Record<string, unknown>
  | unknown[];
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-adapter-interface.ts:24](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-adapter-interface.ts#L24)

The raw payload shape returned by a legacy adapter's request methods,
prior to being normalized by a [MinimumSerializerInterface](../interfaces/MinimumSerializerInterface.md).
