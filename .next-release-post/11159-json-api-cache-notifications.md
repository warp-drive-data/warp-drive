---
releases: ["5.10"]
---
`JSONAPICache` (`@warp-drive/json-api`) now notifies immutable records and editable `checkout()`
copies separately, each only when the value it reads actually changes. This fixes immutable
records that kept rendering the pre-save value after a successful save, a `commit()`, or a
`store.push` whose value matched an uncommitted or in-flight edit, while editable copies no longer
re-render for remote changes they don't show.

- When an `ObjectSchema` declares an identity hash, the cache compares `schema-object` and
  `schema-array` values by that hash instead of by reference. Refetching unchanged data no longer
  rebuilds every child record, and a nested edit the server confirms no longer leaves the record
  dirty. See [`@hash`](/guides/the-manual/schemas/dsl/index.md#hash).
- `changedAttrs()` now reports the correct old value after a remote update, a mid-flight revert,
  or a rejected save, and reverting one nested edit no longer discards its sibling edits.
- Setting an attribute to `undefined` now asserts in development and is stored as `null` in
  production. Use `null` to clear a field.
