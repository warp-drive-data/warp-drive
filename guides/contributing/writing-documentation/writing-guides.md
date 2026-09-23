---
title: Writing Guides
---

# Writing Guides

How to write and maintain the [Guides](/guides/), the markdown pages under `guides/`.

## Audience

Of the [audiences](./index.md#know-your-audience) ***Warp*Drive**'s documentation serves, guides
are written for the ones still learning: technical evaluators deciding whether it fits, hobbyists
trying it out, and new engineers picking up a codebase that already uses it. Assume no knowledge
of the project's history and none of its concepts until the page introduces them. Existing users
arrive too, usually from a search or an API docs link, so cross-link the concepts a page depends
on rather than re-explaining them.

## Guide Types

First check that what you are writing is a guide at all. Upgrade and migration walkthroughs are
not; they live in the repo-root `upgrading/` directory and follow
[Writing Permanent Content](./writing-permanent-content.md).

Guides fall into three types. Keep a single page to a single type; a page that seems to need two
is usually two pages.

### Tutorial

A tutorial walks the reader through building something specific or completing a task. It must
state its prerequisites up front, show complete code at each step, and end with the result the
reader should see. Use it when the reader needs to do something, such as setting up a project or
wiring up their first request. Of the guide audiences, tutorials narrow to hobbyists and new
engineers who have a working project and little else, so every step has to be runnable as
written. Tutorials live in their own top-level [Tutorials](/guides/tutorials/) section
(`guides/tutorials/`), above The Manual section of the guides, so a reader can find them without
knowing which concept they cover.

### Concept

A concept guide explains what something is, why it exists, and how it fits with the rest of
***Warp*Drive**. It must define the concept clearly, explain the problem it solves, and cross-link
the related concepts and APIs it mentions. Use it when the reader needs to understand something
before they can make good decisions about using it, such as how the cache or reactivity works.

### Reference

A reference guide organizes the facts about one area so a reader can look something up. It owns
the prose-level facts: which options exist, what values they accept, which rules apply and when.
It leaves signatures and per-member details to the generated [API Docs](/api/) and links to them
rather than restating them. Use it when the reader already knows what they want and needs the
details.

## Where Files Live and How the Sidebar Is Built

Guides are markdown files under `guides/`. Each directory's `_meta.json` controls how that
directory appears in the sidebar:

- `title` sets the sidebar label for the directory.
- `items` is the ordered list of child slugs (filenames without `.md`, or subdirectory names).
  Unlisted items sort alphabetically after the listed ones, so when you add a page, add its slug
  to `items` where it belongs.
- `files` holds per-file metadata keyed by filename without `.md`, such as a `title` or `draft`. A
  page's own frontmatter `title` wins over a `files` entry when both are set.
- `draft` on the directory, on a `files` entry, or in a page's own frontmatter hides that content
  from the sidebar. The page is still built and reachable at its URL.
- `collapsed` controls whether the directory's sidebar group starts collapsed.

`docs-viewer/src/prepare-website.ts` copies `guides/` into the [VitePress](https://vitepress.dev/)
site at build time. To see the result, follow the
[Docs Viewer README](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md).

## Markdown Features

All [VitePress markdown features](https://vitepress.dev/guide/markdown) are available, including
custom containers (`::: tip`, `::: warning`) and
[code groups](https://vitepress.dev/guide/markdown#code-groups), which render several code blocks
as tabs.

One consequence of VitePress compiling markdown to Vue: a bare `<thing>` in prose is parsed as an
element and fails the build, and `pnpm lint:docs` will not warn you first. Put angle brackets in
code spans.
