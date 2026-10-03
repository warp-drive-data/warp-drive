---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/legacy/compat/extensions/variables/EmberObjectExtension.md
description: >-
  Legacy schema extension that gives reactive objects the classic `EmberObject`
  API such as `get`, `set`, and observers, to ease migration from Ember objects.
---

&#x20;

# &#x20;EmberObjectExtension

```ts
const EmberObjectExtension: CAUTION_MEGA_DANGER_ZONE_Extension;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:105](https://github.com/warp-drive-data/warp-drive/blob/29ab359ab5e9593db23fe661b989f7544558d789/warp-drive-packages/legacy/src/compat/extensions.ts#L105)

A schema extension that adds the classic `EmberObject` API (`get`, `set`,
`getProperties`, `setProperties`, `incrementProperty`, `decrementProperty`,
`toggleProperty`, `notifyPropertyChange`, `addObserver`, `removeObserver`)
to reactive object resources.
