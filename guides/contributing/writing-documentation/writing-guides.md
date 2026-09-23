---
title: Writing Guides
---

# Writing Guides

How to write and maintain the [Guides](../../index.md), the manual compiled from markdown in
`guides/`.

## Audience

Of the [audiences](./index.md#know-your-audience) ***Warp*Drive**'s documentation serves, guides
are written for the ones still learning: technical evaluators deciding whether it fits, hobbyists
trying it out, and new engineers picking up a codebase that already uses it. Assume no knowledge
of the project's history and none of its concepts until the page introduces them. Existing users
arrive too, usually from a search or an API docs link, so cross-link the concepts a page depends
on rather than re-explaining them.

## Guide Types

Most guides fall into one of three types. Decide which one you are writing before you start, and
keep a single page to a single type.

### Tutorial

A tutorial walks the reader through building something specific or completing a task, step by
step. It must state its prerequisites up front, show complete code at each step, and end with the
result the reader should see. Use it when the reader needs to do something, such as setting up a
project or wiring up their first request. Its readers are hobbyists and new engineers who have a
working project and little else, so every step has to be runnable as written. Tutorials live in
their own top-level
[Tutorials](/guides/tutorials/) section (`guides/tutorials/`), above The Manual, so a reader can
find them without knowing which concept they cover.

### Concept

A concept guide explains what something is, why it exists, and how it fits with the rest of
***Warp*Drive**. It must define the concept clearly, explain the problem it solves, and cross-link
the related concepts and APIs it mentions. Use it when the reader needs to understand something
before they can make good decisions about using it, such as how the cache or reactivity works.

### Reference

A reference guide organizes the facts about one area so a reader can look something up: the
available options, the supported values, the rules that apply. It must be complete for the area it
covers and stay in sync with the API docs it summarizes. Use it when the reader already knows what
they want and needs the details, and prefer linking to the generated [API Docs](/api/)
over restating signatures.

Upgrade and migration walkthroughs are not guides; they live in `upgrading/` and follow
[Writing Permanent Content](./writing-permanent-content.md).

## Guides Infra Overview

Guides are markdown files under `guides/`. Each directory's `_meta.json` controls how that
directory appears in the sidebar:

- `title` sets the sidebar label for the directory.
- `items` is the ordered list of child slugs (filenames without `.md`, or subdirectory names).
  Unlisted items sort alphabetically after the listed ones.
- `files` holds per-file metadata keyed by filename without `.md`, such as a `title` or `draft`.
- `draft` on the directory, on a `files` entry, or in a page's own frontmatter hides that content
  from the sidebar.
- `collapsed` controls whether the directory's sidebar group starts collapsed.

`docs-viewer/src/prepare-website.ts` copies `guides/` into the VitePress site at build time, so
the pages you write are the pages that ship. All
[VitePress markdown features](https://vitepress.dev/guide/markdown) are available, including
custom containers (`::: tip`, `::: warning`) and code groups.
