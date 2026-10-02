---
releases: ["5.9"]
---
The `@warp-drive/*` packages now build with rolldown (via tsdown) instead of Vite. Imports and
module format are unchanged, but the published types are different: declarations now live in
`dist/` next to the JavaScript and are rolled up into one file per public entry point, rather
than one file per source module (`@warp-drive/core` drops from 130 `.d.ts` files to 60). Editor
import suggestions only offer public paths as a result, and a type imported from an internal
module path that isn't a package entry point no longer resolves — import it from its public
entry point instead. Packages also now ship sourcemaps.
