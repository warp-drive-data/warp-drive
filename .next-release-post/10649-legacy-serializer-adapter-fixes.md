---
releases: ["5.9"]
---
Two long-standing bugs in `@warp-drive/legacy` are fixed:

- `JSONAPISerializer` now skips resources of unknown types in a payload's primary `data` array,
  as it already did for `included`. Before, the push crashed with "Cannot read properties of
  null".
- `RESTAdapter` no longer throws when an invalid (422) response has a `null` body. It returns
  an `InvalidError` instead.
