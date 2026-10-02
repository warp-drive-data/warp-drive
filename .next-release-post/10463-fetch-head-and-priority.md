---
releases: ["5.9"]
---
The `Fetch` handler in `@warp-drive/core` now supports `HEAD` requests. It resolves them with
`null` content instead of trying to parse a body that doesn't exist. Requests can also pass the
native `priority` fetch hint (`'high'`, `'low'` or `'auto'`) without failing development-mode
request validation.
