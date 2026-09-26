---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/core/reactive/types/AutorefreshBehaviorCombos.md
---

# &#x20;AutorefreshBehaviorCombos

```ts
type AutorefreshBehaviorCombos = 
  | boolean
  | AutorefreshBehaviorType
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType}`
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType},${AutorefreshBehaviorType}`;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:35](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/warp-drive-packages/core/src/signals/request-subscription.ts#L35)

The value accepted by [SubscriptionArgs.autorefresh](SubscriptionArgs.md#autorefresh): either a
boolean, a single [AutorefreshBehaviorType](AutorefreshBehaviorType.md), or a comma-separated
combination of up to three of them.
