---
releases: ["5.9"]
---
`@warp-drive/holodeck` now replays from its `.mock-cache` fixtures in CI. It was meant to record
locally and replay when `CI` is set, but it always recorded, so a test whose fixture was never
committed still passed in CI. After upgrading, such tests fail in CI: run them locally and commit
the fixtures they write (set `IS_RECORDING` to record even when `CI` is set). Replay also now
finds mocks whose URL includes a query string, such as `GET(this, 'users?name=Chris', ...)`.
