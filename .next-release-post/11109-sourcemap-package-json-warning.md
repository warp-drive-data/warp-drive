---
releases: ["5.10"]
---
`@warp-drive/core` no longer lists its `package.json` as a sourcemap source. Apps that re-bundle
it with Vite no longer see a "Sourcemap points to a source file outside its package" warning.
