---
releases: ["5.10"]
---
An aborted request's state now settles with `status: 'cancelled'`, matching the `CancelledRequest`
type it has always declared. Previously every failed request, aborted or not, reported
`status: 'rejected'`, so narrowing on `status === 'cancelled'` never matched. `isError` is still
`true` and `isCancelled` is unchanged for a cancelled request; code that checked
`status === 'rejected'` to catch aborts should check `status === 'cancelled'` or `isCancelled`
instead. See [Control Flow](/guides/the-manual/reactivity/control-flow.md).
