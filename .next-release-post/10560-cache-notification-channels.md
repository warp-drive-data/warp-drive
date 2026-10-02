---
releases: ["5.9"]
---
A sync `linksMode` hasMany on an immutable record no longer goes stale after repeated remote
updates. Every push that changes its membership or order now re-renders it, not just the first
one.

- `@warp-drive/core` exports a new `NotificationChannel` type (`'local' | 'remote'`).
  `store.notifications.subscribe()` and `notify()`, and the `notifyChange()` method a cache calls
  on its capabilities, take an optional trailing channel for `'attributes'` and
  `'relationships'` changes. Custom `Cache` implementations can use it to report local edits
  separately from remote state. Leave it out to keep the old behavior: an untagged notification
  still reaches every subscriber.
- `notify()` accepts an array or `Set` of keys, as does `notifyChange()` for `'attributes'`.
  `JSONAPICache` uses this to send one notification per changed record instead of one per
  changed field, which saves work when you push large payloads. Subscribers are still called
  once per key.
