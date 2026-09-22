---
title: Overview
---

# Writing Documentation

## Where Documentation Lives

- **Guides** (`guides/`): the manual, compiled from markdown and published at
  [/guides](../../index.md). See [Writing Guides](./writing-guides.md).
- **Upgrading and Blog** (`upgrading/`, `blog/`): point-in-time content whose URLs are a permanent
  contract with readers, published at [/upgrading](/upgrading/) and [/blog](/blog/). See
  [Writing Permanent Content](./writing-permanent-content.md).
- **API Docs**: compiled from TSDoc comments in the source code plus each package's
  `src/index.md`, published at [/api](/api/). See
  [Documenting APIs](./writing-api-docs.md).
- **Agent skills** (`warp-drive-packages/memory-alpha/skills/`): plain markdown routed by an
  index, published at [/skills](/skills/). See the
  [memory-alpha README](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/memory-alpha/README.md).
- **Package READMEs**: shown on GitHub and npm only.

## Which Surface Do I Need?

- Documenting a function, class, type, or its params?
  - TSDoc in the source, next to the symbol.
- Teaching a concept or how to accomplish a task?
  - A guide under `guides/`.
- A version-specific upgrade path, deprecation walkthrough, or announcement?
  - `upgrading/` or `blog/`.
- A package overview or quick start?
  - The package README and its `src/index.md`.
- Instructions a coding agent should follow?
  - A memory-alpha skill.

## Cross-Documentation Checklist

New public API:

- TSDoc with `@since` and a usage example.
- A guide showing usage, if it is a concept users need to learn.
- A mention in the package README and `src/index.md`, if it changes the package's headline story.

Breaking change or deprecation:

- Update the affected TSDoc, marking `@deprecated` with a link to the replacement.
- Add or update the `upgrading/` guide.
- Fix README examples that use the old API.

Bug fix:

- Update TSDoc only if documented behavior changed.
- Update a guide only if recommended usage changed.

::: tip
Great documentation requires both guides and API docs. Update any guides affected by a code change
as you make it, and write new guides when appropriate.
:::

Preview any of these locally by following the
[Docs Viewer README](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md).
