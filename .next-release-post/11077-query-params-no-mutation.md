---
releases: ["5.10"]
---
Building a request no longer mutates the params you pass in. `sortQueryParams` and
`buildQueryParams` in `@warp-drive/utilities` used to sort array values in place and turn a
string `include` into an array on your own object, so firing a request with, say, a tracked
array of filter values could visibly reorder that array wherever it was rendered. They now sort
copies. See [Builders](/guides/the-manual/requests/builders.md).
