---
title: Schema DSL
description: Learn what @warp-drive/schema-dsl is for, authoring schemas as TypeScript classes with decorators that a Vite plugin compiles to JSON at build time, and find its API docs.
---

# Schema DSL

:::warning Not published yet
`@warp-drive/schema-dsl` is marked `private` in its `package.json` and is not on npm, so it can't
be installed yet.
:::

`@warp-drive/schema-dsl` lets you author the resource, object and trait [schemas](./index.md) a
[Store](/guides/configuration/#configure-the-store) uses as TypeScript classes, with decorators such as `@Resource` and `@field`, instead of
hand-writing them as `JSON`. A Vite plugin compiles those classes into plain `JSON` schemas at
build time. The decorators do nothing at runtime, so schema files are read by the build and never
imported by application code.

The [`@warp-drive/schema-dsl` API docs](/api/@warp-drive/schema-dsl/) cover the build setup, the
compiled output and each decorator.
