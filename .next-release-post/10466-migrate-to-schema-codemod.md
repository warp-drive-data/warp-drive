---
releases: ["5.9"]
---
`@ember-data/codemods` adds `migrate-to-schema`, which turns EmberData models and mixins into
WarpDrive schemas: a `LegacyResourceSchema` built with `withDefaults`, a TypeScript type, an
extension for computed properties and methods, and traits for mixins and intermediate base
classes. It handles JavaScript and TypeScript models, leaves the original files in place, writes
to `app/data/` by default, and logs each file it skips and why. A JSON config covers custom
transform types, base classes, monorepo sources, and where your app imports WarpDrive APIs from
(`warpDriveImports`). The CLI now ships as a portable Node bundle that runs on macOS, Linux and
Windows via `npx`, `pnpm dlx` or `bunx`. See [Using Codemods](/guides/migrating/codemods.md).

```sh
npx @ember-data/codemods apply migrate-to-schema --project-name my-app
```
