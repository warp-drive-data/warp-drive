---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/legacy/compat/extensions/variables/EmberObjectExtension.md
description: >-
  Legacy schema extension that gives reactive objects the classic `EmberObject`
  API such as `get`, `set`, and observers, to ease migration from Ember objects.
---

&#x20;

# &#x20;EmberObjectExtension

```ts
const EmberObjectExtension: CAUTION_MEGA_DANGER_ZONE_Extension;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:105](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/legacy/src/compat/extensions.ts#L105)

A schema extension that adds the classic `EmberObject` API (`get`, `set`,
`getProperties`, `setProperties`, `incrementProperty`, `decrementProperty`,
`toggleProperty`, `notifyPropertyChange`, `addObserver`, `removeObserver`)
to reactive object resources.
