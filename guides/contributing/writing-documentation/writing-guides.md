---
title: Writing Guides
---

# Writing Guides

How to write and maintain the [Guides](../../index.md), the manual compiled from markdown in
`guides/`.

## Writing Effective Guides

### 1. Know Your Audience

***Warp*Drive**'s Documentation has to balance appealing to many different audiences. Here are some example audiences:

- 1. VPs and Directors who hear about ***Warp*Drive** at a conference and feel their team should evaluate whether it solves their business problems
- 2. Tech Leads and Senior ICs or Architects who hear about it and want to decide if it solves their tech needs
- 3. Hobbyists who heard about it and want to try it for a weekend project
- 4. Engineers who just started at a company and want to learn about this thing the company uses
- 5. Existing Users who want to find the documentation for something, learn the project deeper, or need to know how to update from X to Y.

Our guides attempt to cater to these varied audiences by defaulting to the assumption that the reader is one that either does not use ***Warp*Drive** yet or is just getting started.

From this perspective, here are a few guidelines to keep in mind:

- Landing page / introduction content should attempt to entice decision makers (categories 1-3 above)
- Guides material should always start from the assumption that the readers don't have context on the project's history (categories 1-4)
- Concepts should always be cross-linked when possible, especially when first introducing the concept (everyone)
- Migrations guides can presume some historical knowledge of older concepts, but should not presume knowledge of newer concepts (categories 4 and 5)
- Guides material specific to legacy should be kept separate from other guides material (categories 4 and 5)

Some examples of ways to achieve this balance:

- [Upgrading](/upgrading/) is a top level section to help those category 5 users find what they are looking for faster.
- Explicitly named legacy pages (such as [Setup - Legacy (Ember)](/guides/configuration/ember) help those users without muddying instructions for everyone else. Note: this clarity also helps decision makers, as they will like to see that when the time for change comes there are resources to help them that are easy to find and well marked - but which they don't need to know about just yet.

### 2. Iterate, A Lot

Making great documentation requires a lot of iteration. A great way to iterate is to write documentation that someone needs, ask them to use it - and use the feedback from where they
stumble to improve the documentation for the next person. The more iteration that happens,
the more the docs become a source of information that works well for everyone.

## Guide Types

Most guides fall into one of three types. Decide which one you are writing before you start, and
keep a single page to a single type.

### Tutorial

A tutorial walks the reader through building something specific or completing a task, step by
step. It must state its prerequisites up front, show complete code at each step, and end with the
result the reader should see. Use it when the reader needs to do something, such as setting up a
project or wiring up their first request.

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
