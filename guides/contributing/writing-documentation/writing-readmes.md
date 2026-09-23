---
title: Writing READMEs
---

# Writing READMEs

Every published package has a `README.md` next to its `package.json`. It is the first thing a
reader sees on the package's GitHub directory and on its npm page, and `package.json` lists it in
`files` so it ships in the tarball. Its job is to say what the package is, whether the reader
wants it, and where the real documentation lives. It is not the place to teach the package.

## Audience

Of the [audiences](./index.md#know-your-audience) ***Warp*Drive**'s documentation serves, a
README is for two readers: a technical evaluator or hobbyist on npm or GitHub deciding whether to
install this package at all, and someone who just installed it and needs to know the first thing
to do. Neither is reading the docs site yet, so the README has to stand on its own, and neither
wants depth, so it has to hand them off quickly.

## Structure

A package README has these sections, in this order. The packages named in parentheses are the
ones the shape is taken from; copy from them.

- **Logo block.** A centered `<img>` of `./logos/logo-yellow-slab.svg` with `class="project-logo"`.
  The package's `logos/` directory is a synced copy of the repo-root `logos/synced/` (see the
  notice in `logos/synced/README.md`), so never edit it inside a package.
- **Badges.** Five badges from shields.io: npm version, npm downloads, license, and the EmberJS
  and ***Warp*Drive** Discord servers. Copy the block verbatim from another package, including its
  `ember-data` targets for the version and download counts; do not retarget it per package. If the
  package wants its own release badges, add a **Tagged Releases** list between the H1 and the
  description (`@warp-drive/ember` has one).
- **Package name as the H1**, `# @warp-drive/json-api`. `@warp-drive/core` is the exception: it
  is the project's front door and uses the ***Warp*Drive** tagline instead.
- **One paragraph on what it is and who should use it.** `@warp-drive/json-api` says it is a
  `{json:api}` cache implementation and that most apps should use it. If the package is
  deprecated, say so here in a GitHub alert (`> [!WARNING]`), as `@warp-drive/legacy` does.
- **Install and first step, only when the docs link below cannot be the first step.** That is
  the case when the package is used in a way the guides do not cover: `@warp-drive/memory-alpha`
  is read from `node_modules` rather than imported, so its `## Usage` shows `npm install` and a
  code sample. A library package installed and imported the normal way needs neither.
- **`## Documentation`** with the same single line every package uses, a *Get Started* link to
  the Guides as an absolute URL. The README is rendered by GitHub and npm, so the root-relative
  `/guides/` links the rest of the docs use do not resolve here.
- **`## Code of Conduct` and `### License`**, linking the repo's `CODE_OF_CONDUCT.md` on GitHub
  and the package's own `LICENSE.md`, which ships in `files` alongside the README.

A few older READMEs (`@warp-drive/ember`, `@ember-data/request`) predate this shape and carry a
full manual. Do not copy that: their API detail has to be kept in sync by hand, and the link
checker does not cover READMEs (see
[Checking Links](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md#checking-links)
in the Docs Viewer README).

## README vs src/index.md

Each package's `typedoc.config.mjs` sets `readme`. Where it is `'src/index.md'` (as in
`warp-drive-packages/core`, `json-api`, `ember`, `legacy`, and `utilities`), TypeDoc renders that
file as the package's landing page in the [API docs](/api/) at `/api/<package-name>/`, above the
generated member listing. Where it is `'none'`, the package has no landing prose.

The split follows from where each file renders:

- `README.md` is GitHub-flavored markdown for GitHub and npm. Use `> [!WARNING]` alerts and
  absolute URLs. It answers "should I install this?".
- `src/index.md` is VitePress markdown for the docs site. It can use `:::tip` and `:::warning`
  containers, `::: code-group`, root-relative links like `/api/@warp-drive/core/`, and TSDoc
  `{@link}` references, as `packages/request/src/index.md` does. It starts with the package name
  as an H1 and answers "I am on the API docs for this package, where do I start?", so this is the
  place for the setup snippet, as `warp-drive-packages/json-api/src/index.md` shows.

Some packages still duplicate paragraphs between the two, or leave `src/index.md` empty. When you
touch one, read the other and move each sentence to the file that answers its question.

## Keep It Short

A README links to the [Guides](/guides/) and the [API docs](/api/) instead of restating them.
Concepts live in a guide (see [Writing Guides](./writing-guides.md)); signatures, options, and
per-member behavior live in TSDoc (see [Documenting APIs](./writing-api-docs.md)). If a README
sentence explains how something works, it belongs in one of those and the README should link
there.

When code changes, follow the
[Cross-Documentation Checklist](./index.md#cross-documentation-checklist): a new public API
gets a README or `src/index.md` mention only if it changes the package's headline story, and a
breaking change means fixing any README example that uses the old API. Preview `src/index.md`
changes as described in [Previewing Your Changes](./index.md#previewing-your-changes); preview
README changes by viewing the file on your branch on GitHub.
