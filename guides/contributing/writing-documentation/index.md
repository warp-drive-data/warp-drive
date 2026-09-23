---
title: Overview
---

# Writing Documentation

## Know Your Audience

***Warp*Drive**'s documentation has to balance appealing to many different audiences:

- **Decision makers**: VPs and Directors who hear about ***Warp*Drive** at a conference and feel
  their team should evaluate whether it solves their business problems.
- **Technical evaluators**: Tech Leads, Senior ICs, and Architects who want to decide if it
  solves their tech needs.
- **Hobbyists** who heard about it and want to try it for a weekend project.
- **New engineers** who just started at a company and want to learn about this thing the company
  uses.
- **Existing users** who want to find the documentation for something, learn the project deeper,
  or need to know how to upgrade from one version to the next.

Default to assuming the reader either does not use ***Warp*Drive** yet or is just getting started.
Each type of doc below narrows that default to its own readers, but a few guidelines apply
everywhere:

- Landing pages and introductions should entice decision makers and technical evaluators, and
  give hobbyists a fast path in.
- Anything that teaches should start from the assumption that the reader has no context on the
  project's history.
- Cross-link concepts whenever possible, especially when first introducing one.
- Content for existing users, such as upgrade guides and legacy setup, can presume some knowledge
  of older concepts but should never presume knowledge of newer ones, and should be kept separate
  from everything else so it does not muddy the path for new readers.

Two examples of that separation: [Upgrading](/upgrading/) is a top-level section so existing
users find it fast, and explicitly named legacy pages such as
[Setup - Legacy (Ember)](/guides/configuration/ember) keep legacy instructions out of everyone
else's way. That clarity also helps decision makers, who like to see that when the time for
change comes there are well-marked resources to help, without needing to know about them yet.

## Iterate, A Lot

Making great documentation requires a lot of iteration. A great way to iterate is to write
documentation that someone needs, ask them to use it, and use the feedback from where they
stumble to improve the documentation for the next person. The more iteration that happens, the
more the docs become a source of information that works well for everyone.

## Which Type of Doc Should I Write?

- **Documenting a function, class, type, or its params?** Write **API Docs**: TSDoc comments in
  the source next to the symbol, plus each package's `src/index.md`. Published at [/api](/api/).
  See [Documenting APIs](./writing-api-docs.md).
- **Teaching a concept or how to accomplish a task?** Write a **Guide** under `guides/`: the
  manual, compiled from markdown and published at [/guides](../../index.md). Step-by-step
  walkthroughs go in the [Tutorials](/guides/tutorials/) section (`guides/tutorials/`). See
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
- Fix Guides and README examples that use the old API.

Bug fix:

- Update TSDoc only if documented behavior changed.
- Update a guide only if recommended usage changed.

::: tip
Great documentation requires both guides and API docs. Update any guides affected by a code change
as you make it, and write new guides when appropriate.
:::

Preview any of these locally by following the
[Docs Viewer README](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md).
Once the change is in a pull request, add the `:label: doc` label and a preview of the whole site
is deployed to `https://canary.warp-drive.io/pr-preview/pr-<number>/` and linked from a comment
on the PR.
