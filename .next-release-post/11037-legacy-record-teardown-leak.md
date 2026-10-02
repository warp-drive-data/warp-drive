---
releases: ["5.10"]
---
`@warp-drive/legacy` fixes a memory leak for schema-backed legacy records (records not backed by
a `Model` class) in stores created with `useLegacyStore`. Once such a record accessed a
relationship, unloading it left behind an entry that kept the store, and through it the
application, alive. Test suites that create many applications are the most likely to notice the
lower memory use.
