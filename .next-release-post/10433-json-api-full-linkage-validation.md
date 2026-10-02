---
releases: ["5.9"]
---
When [`LOG_CACHE`](/guides/the-manual/debugging/index.md) is on, the payload report
`JSONAPICache` logs in development also checks the compound-document rules of the {json:api}
spec. It flags a resource that appears more than once in the same payload, a relationship whose
`data` points at a resource the payload doesn't include, and an `included` resource that no
relationship reaches from the primary `data`. Duplicates are a common slip in hand-written
mocks, and the report names every place the resource appears.
