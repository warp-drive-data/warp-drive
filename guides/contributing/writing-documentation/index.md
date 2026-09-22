---
title: Overview
---

# Writing Documentation

## Which Type of Doc Should I Write?

- **Documenting a function, class, type, or its params?** Write **API Docs**: TSDoc comments in
  the source next to the symbol, plus each package's `src/index.md`. Published at [/api](/api/).
  See [Documenting APIs](./writing-api-docs.md).
- **Teaching a concept or how to accomplish a task?** Write a **Guide** under `guides/`: the
  manual, compiled from markdown and published at [/guides](../../index.md). See
  [Writing Guides](./writing-guides.md).
- **A version-specific upgrade path, deprecation walkthrough, or announcement?** Write
  **Upgrading or Blog** content under `upgrading/` or `blog/`: point-in-time pages whose URLs are a
  permanent contract with readers, published at [/upgrading](/upgrading/) and [/blog](/blog/). See
  [Writing Permanent Content](./writing-permanent-content.md).
- **A package overview or quick start?** Write the **Package README**, shown on GitHub and npm
  only, and its `src/index.md`.
- **Instructions a coding agent should follow?** Write an **Agent skill** under
  `warp-drive-packages/memory-alpha/skills/`: plain markdown routed by an index, published at
  [/skills](/skills/). See the
  [memory-alpha README](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/memory-alpha/README.md).

## Cross-Documentation Checklist

Most code changes affect more than one type of doc. Use this checklist to find every doc a
change should touch, so a new API does not land with TSDoc but no guide, or a deprecation
without an upgrade path.

New public API:

- TSDoc with `@since` and a usage example.
- A guide showing usage, if it is a concept users need to learn.
- A mention in the package README and `src/index.md`, only if it changes the package's headline
  story.

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
