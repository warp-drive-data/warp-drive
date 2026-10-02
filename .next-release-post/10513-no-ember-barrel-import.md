---
releases: ["5.9"]
---
`ember-data` and `@warp-drive/legacy` no longer import the `ember` barrel module, removing a
blocker for Ember 7. As a result, `ember-data` no longer registers itself in `Ember.libraries`,
and `cacheFor` on records using the `EmberObjectExtension` or `EmberObjectArrayExtension` from
`@warp-drive/legacy/compat/extensions` now throws, since Ember removed it with no replacement.
