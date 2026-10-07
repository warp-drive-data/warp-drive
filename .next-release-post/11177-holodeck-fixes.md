---
releases: ["5.10"]
---
`@warp-drive/holodeck` fixes that make a passing suite trustworthy and a failing one readable:

- A test that declares a mock it never requests now fails from `afterEach`, naming each method,
  url and count, in both record and replay. Remove the mock or make the request it describes.
- A missing fixture's `MOCK_NOT_FOUND` detail, including the cache key it looked for, now
  appears in the thrown error and the CI log, and a rejected recording throws instead of
  failing silently.
- Response generators no longer run during replay.
- Aborted requests no longer crash the mock server.
- `ensure-cert` checks that `mkcert` is installed, works with any shell (including fish), and
  falls back to explaining the manual setup instead of throwing.

See [Troubleshooting](/guides/the-manual/testing/troubleshooting.md).
