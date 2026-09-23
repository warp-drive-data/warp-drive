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
- **LLMs and coding agents** answering questions about ***Warp*Drive** or writing code against
  it, whether from the published site, the TSDoc in the source, or the agent skills. They read
  one page at a time with no memory of the rest, and they will present whatever pattern they find
  as current unless the page says otherwise.

Default to assuming the reader either does not use ***Warp*Drive** yet or is just getting started.
The guide for each type of doc narrows that default to its own readers, but a few guidelines apply
everywhere:

- Landing pages and introductions should entice decision makers and technical evaluators, and
  give hobbyists a fast path in.
- Anything that teaches should start from the assumption that the reader has no context on the
  project's history.
- Cross-link concepts whenever possible, especially when first introducing one.
- Use one name per concept and use it everywhere. Mark recommended, legacy, and deprecated
  approaches explicitly where they appear, with the `@recommended`, `@discouraged`, and
  `@deprecated` tags in API docs and "Legacy" in page titles, so a reader or model landing on an
  older pattern cannot mistake it for the current one. Make each page answer its own question
  without depending on the reader having seen a neighbor.
- Content for existing users, such as upgrade guides and legacy setup, can presume some knowledge
  of older concepts but should never presume knowledge of newer ones, and should be kept separate
  from everything else so it does not muddy the path for new readers. [Upgrading](/upgrading/) is
  its own top-level section and legacy pages are explicitly named, such as
  [Setup - Legacy (Ember)](/guides/configuration/ember), for exactly this reason.

## Iterate, A Lot

Write the documentation someone needs, ask them to use it, and fix the places where they stumble
before the next person reads it. Every round of that makes the docs work for a wider audience.

## Which Type of Doc Should I Write?

- **Documenting a function, class, type, or its params?** Write **API Docs**:
  [TSDoc](https://tsdoc.org/) comments in the source next to the symbol. Published at
  [/api](/api/). See [Documenting APIs](./writing-api-docs.md).
- **Introducing a package as a whole?** Write its **README**, shown on GitHub and npm, and its
  `src/index.md`, which is the package's landing page in the API docs. See
  [Writing READMEs](./writing-readmes.md).
- **Teaching a concept or how to accomplish a task?** Write a **Guide** under `guides/`, compiled
  from markdown and published at [/guides](/guides/). Step-by-step walkthroughs go in the
  [Tutorials](/guides/tutorials/) section (`guides/tutorials/`). See
  [Writing Guides](./writing-guides.md).
- **Walking existing users through an upgrade or a deprecation?** Write an **Upgrading** page
  under `upgrading/`, published at [/upgrading](/upgrading/).
- **Announcing something as of a point in time?** Write a **Blog** post under `blog/`, published
  at [/blog](/blog/). Upgrading and Blog pages both have permanent URLs; see
  [Writing Permanent Content](./writing-permanent-content.md).
- **Instructions a coding agent should follow?** Write an **Agent skill** under
  `warp-drive-packages/memory-alpha/skills/`: plain markdown routed by an index, published at
  [/skills](/skills/). See [Writing Agent Skills](./writing-agent-skills.md).

## Cross-Documentation Checklist

Most code changes affect more than one type of doc. Use this checklist to find every doc a
change should touch, so a new API does not land with TSDoc but no guide, or a deprecation
without an upgrade path.

New public API:

- TSDoc with `@since` set to the version it ships in, and a usage example.
- A guide showing usage, if it is a concept users need to learn.
- A mention in the package README and `src/index.md`, only if it changes the package's headline
  story.

Breaking change or deprecation:

- Update the affected TSDoc, marking `@deprecated` with a link to the replacement.
- Add or update the `upgrading/` guide for the version the change ships in.
- Fix Guides and README examples that use the old API.

Bug fix:

- Update TSDoc only if documented behavior changed.
- Update a guide only if recommended usage changed.

## Previewing Your Changes

Preview any type of doc locally by following the
[Docs Viewer README](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md).
Once the change is in a pull request, add the `:label: doc` label (the label's name literally
contains `:label:`) and a preview of the whole site, API docs included, is deployed to
`https://canary.warp-drive.io/pr-preview/pr-<number>/` and linked from a comment on the PR.
