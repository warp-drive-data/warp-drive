---
releases: ["5.9"]
---
In development builds, `@warp-drive/core`'s fetch handler guesses whether Mirage (or another
Pretender-based mock) is serving requests, and the guess can be wrong either way: some Mirage
setups don't expose `window.server`, while APM agents and browser extensions also patch `fetch`.
Call `globalThis.setWarpDriveIsMaybeMirage(true)` or `(false)` to override the guess; it is
available outside tests too, for Mirage in `ember serve`. A wrong guess also no longer throws
when the response's headers are immutable.
