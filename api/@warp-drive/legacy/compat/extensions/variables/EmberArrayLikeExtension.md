---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/extensions/variables/EmberArrayLikeExtension.md
description: >-
  Legacy schema extension that gives reactive arrays Ember array methods such as
  `pushObject`, `mapBy`, `filterBy`, and `firstObject`.
---

&#x20;

# &#x20;EmberArrayLikeExtension

```ts
const EmberArrayLikeExtension: CAUTION_MEGA_DANGER_ZONE_Extension;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:382](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/legacy/src/compat/extensions.ts#L382)

A schema extension that adds Ember's classic `MutableArray`/`Enumerable`
style methods (`pushObject`, `removeObject`, `mapBy`, `filterBy`,
`sortBy`, `firstObject`, `lastObject`, etc.) to reactive array resources.
