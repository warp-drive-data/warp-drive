---
title: Writing Agent Skills
---

# Writing Agent Skills

How to add or change a skill in [`@warp-drive/memory-alpha`](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/memory-alpha/README.md),
the package of plain-markdown instructions that AI coding agents read when they work in this repo
or in an app that depends on ***Warp*Drive**. The same files are published for humans at
[/skills](/skills/).

## Audience

Of the [audiences](./index.md#know-your-audience) our documentation serves, a skill has two: the
coding agent that will follow it, and the human who opens the published copy to see what agents
are being told. Write for the agent. It has the repo in front of it and no conversation history,
so give it the rule, the reason, and the exact place to look, and nothing it can read for itself.
Assume it uses ***Warp*Drive** if the skill is in `skills/contributors/`, and assume it does not
if the skill is in a consumer directory such as `skills/schemas/` or `skills/requests/`.

## How agents reach a skill

Agents do not browse the package. Each agent surface in the repo (`AGENTS.md`, which `CLAUDE.md`
and `GEMINI.md` import, plus the Copilot and Cursor pointer files) tells the agent to open one
routing table and read only the row that matches its task:

- `skills/contributors/index.md` routes agents contributing to ***Warp*Drive** itself.
- `skills/index.md` routes agents consuming `@warp-drive/*` packages in an app.

A skill that is not in the right table does not exist as far as agents are concerned. Adding a
skill therefore always means touching four files in its directory: the skill itself, `index.md`
(the agent-facing table), `overview.md` (the same table with links, published in place of
`index.md` on the website), and `_meta.json` (sidebar title and order for the website).

## Writing the skill file

- **No YAML frontmatter.** The package README explains why: downstream tooling adapts these files
  into tool-specific formats (Claude skills, Cursor rules, Copilot instructions) and adds its own
  frontmatter, so ours would collide. Title and ordering live in `_meta.json` instead.
- **Open with the trigger.** The first sentence is "Use this skill whenever..." followed by the
  situation, so an agent that landed here from the table can confirm it is in the right place.
- **Then `## Steps`**, numbered, each one an action the agent can take. Put the reason for a rule
  in the step that states it. Existing skills such as
  [Start in a Fresh Worktree](/skills/contributors/start-in-a-fresh-worktree.md) and
  [Keep Commits Human-Authored](/skills/contributors/keep-commits-human-authored.md) are the
  house style.
- **Link, don't restate.** If a human guide owns a rule, link the guide and its heading rather
  than copying the rule. A copied rule goes stale silently; a link fails the link checker.
- **Stay tool-agnostic.** Say "ask the user" and "a fresh agent instance", not the name of one
  product's tool or command. The skill is read by several agents.
- **Put angle brackets in code spans.** VitePress compiles markdown to Vue, so a bare `<thing>`
  in prose is parsed as an element and fails the docs build.
- **Link paths.** Sibling skills are linked relatively (`./other-skill.md`); guides are linked by
  site path (`/guides/contributing/...md`); anchors must match a real heading.
- **Keep it short.** Reviewers push back on long skills. If a skill needs more than about 100
  lines, some of it belongs in a human guide that the skill links.

## Wiring it in

In the skill's directory:

1. Add a row to `index.md`: the situation in the first column, the bare filename in the second.
   Rows that apply to every session are listed first and called out below the table; put a
   task-specific skill after them.
2. Add the matching row to `overview.md`, with the second column as a link:
   `[Title](/skills/contributors/your-skill.md)`.
3. In `_meta.json`, add the slug to `items` where it should sit in the sidebar, and add
   `"your-skill": { "title": "Your Title" }` under `files`.

## Publishing and drafts

`docs-viewer/src/prepare-website.ts` copies the package's `skills/` directory to `/skills` on the
website on every build. Unlike guides, this copy is passed through `finalizeSyncedContent`, so a
page marked `draft` in `_meta.json` is removed from the site entirely rather than merely hidden
from the sidebar. That is how each directory's agent-facing `index.md` stays out of the website
while `overview.md` is published in its place (`"webIndex": "overview"` in `_meta.json`).

## Checking your work

- `pnpm lint:docs` from the repo root checks every link and heading anchor in `skills/` along
  with the guides.
- Build the site as the [Docs Viewer README](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md)
  describes and open `/skills/contributors/` to see the sidebar entry and rendered page.
- Hand the skill, and only the skill, to a fresh agent instance with a task it should cover, and
  check that it lands on the right guide and does not name a tool specific to one product.
