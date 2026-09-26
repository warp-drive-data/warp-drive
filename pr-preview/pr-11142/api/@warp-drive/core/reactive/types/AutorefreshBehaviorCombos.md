---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/reactive/types/AutorefreshBehaviorCombos.md
---

# &#x20;AutorefreshBehaviorCombos

```ts
type AutorefreshBehaviorCombos = 
  | boolean
  | AutorefreshBehaviorType
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType}`
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType},${AutorefreshBehaviorType}`;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:35](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/signals/request-subscription.ts#L35)

The value accepted by [SubscriptionArgs.autorefresh](SubscriptionArgs.md#autorefresh): either a
boolean, a single [AutorefreshBehaviorType](AutorefreshBehaviorType.md), or a comma-separated
combination of up to three of them.
