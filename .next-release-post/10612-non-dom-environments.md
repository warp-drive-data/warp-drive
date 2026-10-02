---
releases: ["5.9"]
---
***Warp*Drive** no longer crashes in environments without full browser globals, like React
Native. `@warp-drive/core` used to assume `window.addEventListener`, `document` and
`DOMException` were present. Now it checks for them first. Without those APIs, the
online/visibility listeners that drive `<Request />` auto-refresh are skipped, and abort errors
fall back to a plain `Error` with the same `name`. Browser behavior is unchanged.
