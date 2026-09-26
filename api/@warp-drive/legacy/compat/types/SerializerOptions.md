---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/types/SerializerOptions.md
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

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts:19](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts#L19)

Options accepted by [serialize](MinimumSerializerInterface.md#serialize)
and related legacy serializer methods.

## Properties

### includeId?

```ts
optional includeId?: boolean;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts:23](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/legacy/src/compat/legacy-network-handler/minimum-serializer-interface.ts#L23)

whether the resource's id should be included in the serialized output
