---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/legacy/model-fragments/variables/modelFor.md
---

&#x20;

# &#x20;modelFor

```ts
const modelFor: typeof fragmentsModelFor = fragmentsModelFor;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/hooks/model-for.ts:140](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/legacy/src/model-fragments/hooks/model-for.ts#L140)

The `modelFor` fallback used to construct a `ShimModelClass` schema for a
type when ModelFragments support is enabled and no real `Model` subclass
is registered for that type.
