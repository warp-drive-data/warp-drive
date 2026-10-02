---
releases: ["5.10"]
---
The manual has a new Testing section on `@warp-drive/holodeck`, the HTTP mock server that records
the responses a test needs and replays them from disk. It covers server and client setup, test
framework integration, writing mocks, record and replay (including the `.mock-cache` fixtures to
commit), and a troubleshooting page indexed by the messages holodeck prints. A Common Setups
section shows how to put holodeck on the test page's origin with Vite, testem, or Caddy, and a
cookbook recipe runs holodeck next to the dev server so tests also pass when opened from it. See
[Testing with Holodeck](/guides/the-manual/testing/index.md) and
[Holodeck in Dev Mode](/guides/the-manual/cookbook/holodeck-in-dev-mode.md).
