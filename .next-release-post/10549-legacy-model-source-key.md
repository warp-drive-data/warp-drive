---
releases: ["5.9"]
---
`@attr`, `@belongsTo` and `@hasMany` in `@warp-drive/legacy/model` accept a `sourceKey` option
for when the API's field name differs from the property name. For example,
`@attr('string', { sourceKey: 'first-name' }) firstName` reads and writes `first-name` in the
cache. Several fixes help apps that mix `Model`s with schema-only resources while they migrate:

- `JSONSerializer`'s `shouldSerializeHasMany` and the `EmbeddedRecordsMixin` work for resources
  with no `Model` class, such as those defined with `withDefaults` from
  `@warp-drive/legacy/model/migration-support`.
- `store.modelFor()` no longer asserts on stores created with `useLegacyStore({ linksMode: true })`.
- Looking up schema fields for a type with no registered model throws
  `No model was found for '<type>'` instead of recursing forever.
