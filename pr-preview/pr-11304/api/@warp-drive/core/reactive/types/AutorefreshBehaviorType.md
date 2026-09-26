---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/core/reactive/types/AutorefreshBehaviorType.md
description: >-
  One autorefresh trigger for a request subscription: on reconnecting
  (`online`), on a timer (`interval`), or on store invalidation (`invalid`).
---

# &#x20;AutorefreshBehaviorType

```ts
type AutorefreshBehaviorType = "online" | "interval" | "invalid";
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:31](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/signals/request-subscription.ts#L31)

The individual autorefresh strategies a [RequestSubscription](RequestSubscription.md)
may combine, see [AutorefreshBehaviorCombos](AutorefreshBehaviorCombos.md).
