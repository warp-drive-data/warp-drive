---
releases: ["5.10"]
---
The `@ember-data-types/*` and `@warp-drive-types/core-types` packages ship their
`unstable-preview-types` declarations again. Versions published since `5.9.0-alpha.22` contained
no `.d.ts` files, so apps typing a 4.x runtime with these packages fell back to older types (for
example, `store.request` results typed as `unknown`). See
[Using Types Packages](/guides/the-manual/typescript/configuration.md#using-types-packages).
