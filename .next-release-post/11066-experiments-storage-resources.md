---
releases: ["5.10"]
---
Storage Resources can now be imported from `@warp-drive/experiments/storage`. The reactive
`localStorage`/`sessionStorage` wrappers and the `LocalResource`, `SessionResource`,
`CacheResource`, `field` and `effect` decorators shipped in 5.9 but had no package export, so
they were unreachable. This release also:

- adds `@param` with the `BooleanParam` and `NumberParam` config helpers, which mark a field as a
  URL query param source (metadata only; wiring it to a router is left to the app);
- adds `onStorageEvent`, which subscribes to cross-tab storage events and returns an unsubscribe
  function;
- exports the `KeyFn` and `ValueTransition` types;
- fixes `@field('local' | 'session')` overrides writing to the wrong storage, and an Ember
  assertion that made every `@field` read throw.

See [Storage Resources](/guides/the-manual/experiments/storage-resources.md).
