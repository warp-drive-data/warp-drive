---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/legacy/compat/types/SerializerOptions.md
description: >-
  Options for legacy serializer `serialize` calls, such as `includeId` to
  include the record id in the output.
---

&#x20;

# &#x20;SerializerOptions

```ts
type SerializerOptions = {
  includeId?: boolean;
};
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts:19](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts#L19)

Options accepted by [serialize](MinimumSerializerInterface.md#serialize)
and related legacy serializer methods.

## Properties

### includeId?

```ts
optional includeId?: boolean;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts:23](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts#L23)

whether the resource's id should be included in the serialized output
