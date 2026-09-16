---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/type-aliases/AutorefreshBehaviorCombos.md
---

# &#x20;AutorefreshBehaviorCombos

```ts
type AutorefreshBehaviorCombos = 
  | boolean
  | AutorefreshBehaviorType
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType}`
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType},${AutorefreshBehaviorType}`;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:35](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/signals/request-subscription.ts#L35)

The value accepted by [SubscriptionArgs.autorefresh](../interfaces/SubscriptionArgs.md#autorefresh): either a
boolean, a single AutorefreshBehaviorType, or a comma-separated
combination of up to three of them.
