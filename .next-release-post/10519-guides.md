---
releases: ["5.9"]
---
The Manual is reorganized into topic sections, among them Relational Data, Reactivity,
TypeScript, Debugging and Mutations, and several pages that were placeholders in 5.8 are now
written:

- [Reactivity](/guides/the-manual/reactivity/index.md) explains how WarpDrive uses signals as
  "gates" next to the cache rather than as storage, with new pages on
  [Reactive Control Flow](/guides/the-manual/reactivity/control-flow.md) and on treating
  [Async as Reactive State](/guides/the-manual/reactivity/derivation.md) with `getPromiseState`.
- [Debugging](/guides/the-manual/debugging/index.md) covers turning on WarpDrive's instrumented
  logging at runtime or build time and what each log flag shows.
- The schema guides gain full pages on [Derivations](/guides/the-manual/schemas/derivations.md),
  [Transformations](/guides/the-manual/schemas/transformations.md) (including how to register
  them), [Traits](/guides/the-manual/schemas/traits.md) and
  [Complex Fields](/guides/the-manual/schemas/complex-fields.md).

The TypeScript guides' examples now import from `@warp-drive/core` and `@warp-drive/legacy`
instead of the pre-5.x `@ember-data/*` packages.
