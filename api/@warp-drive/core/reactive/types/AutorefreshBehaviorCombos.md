---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/reactive/types/AutorefreshBehaviorCombos.md
description: >-
  The accepted values for a request subscription's `autorefresh` option: a
  boolean or a comma-separated mix of `online`, `interval`, and `invalid`.
---

# &#x20;AutorefreshBehaviorCombos

```ts
type AutorefreshBehaviorCombos = 
  | boolean
  | AutorefreshBehaviorType
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType}`
  | `${AutorefreshBehaviorType},${AutorefreshBehaviorType},${AutorefreshBehaviorType}`;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:41](https://github.com/warp-drive-data/warp-drive/blob/2aa21ad9839e44187e51cb047292dba6d70de712/warp-drive-packages/core/src/signals/request-subscription.ts#L41)

The value accepted by [SubscriptionArgs.autorefresh](SubscriptionArgs.md#autorefresh): either a
boolean, a single [AutorefreshBehaviorType](AutorefreshBehaviorType.md), or a comma-separated
combination of up to three of them.
