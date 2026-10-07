---
releases: ["5.10"]
---
In `@warp-drive/ember`, `<Request />` and `<Await />` no longer crash the current render when a
request or promise rejects and no `<:error>` block is provided. The error is rethrown a tick
later instead, so it still surfaces as an uncaught error for crash reporting without taking down
the render that observed it. Cancellations are still not rethrown. To catch a missing `<:error>`
block before it ships, enable the `template-require-request-error-block` (Ember) or
`require-request-error-block` (React) rule from `eslint-plugin-warp-drive`.
