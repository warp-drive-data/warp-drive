---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/legacy/compat/type-aliases/SerializerOptions.md
---

&#x20;

# &#x20;SerializerOptions

```ts
type SerializerOptions = object;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts:16](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts#L16)

Options accepted by [serialize](../interfaces/MinimumSerializerInterface.md#serialize)
and related legacy serializer methods.

## Properties

### includeId?

```ts
optional includeId?: boolean;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts:20](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts#L20)

whether the resource's id should be included in the serialized output
