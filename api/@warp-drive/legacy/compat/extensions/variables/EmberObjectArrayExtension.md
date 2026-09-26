---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/extensions/variables/EmberObjectArrayExtension.md
description: >-
  Legacy schema extension that gives reactive arrays the classic `EmberObject`
  API such as `get`, `set`, and observers, to ease migration from Ember objects.
---

&#x20;

# &#x20;EmberObjectArrayExtension

```ts
const EmberObjectArrayExtension: CAUTION_MEGA_DANGER_ZONE_Extension;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:91](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/legacy/src/compat/extensions.ts#L91)

A schema extension that adds the classic `EmberObject` API (`get`, `set`,
`getProperties`, `setProperties`, `incrementProperty`, `decrementProperty`,
`toggleProperty`, `notifyPropertyChange`, `addObserver`, `removeObserver`)
to reactive array resources.
