---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/type-aliases/AutorefreshBehaviorCombos.md
---

# &#x20;AutorefreshBehaviorCombos

```ts
type AutorefreshBehaviorCombos = 
  | boolean
  | AutorefreshBehaviorType
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType}`
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType},${AutorefreshBehaviorType}`;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:35](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/signals/request-subscription.ts#L35)

The value accepted by [SubscriptionArgs.autorefresh](../interfaces/SubscriptionArgs.md#autorefresh): either a
boolean, a single AutorefreshBehaviorType, or a comma-separated
combination of up to three of them.
