# Internal Docs Viewer

## docs.warp-drive.io

### Development

From this directory (`docs-viewer/`), with the repo's toolchain installed per
[Setting Up The Project](../guides/contributing/setting-up-the-project.md), run:

```bash
pnpm start
```

This runs `bun ./src/sync-guides.ts`, which:

- builds the API docs with TypeDoc
- watches every package `src/` directory plus `guides/`, `upgrading/`, `blog/`, and
  `warp-drive-packages/memory-alpha/skills/`, re-syncing content and rebuilding API docs on change
- runs `vitepress dev` with hot reload

The sidebar is computed once, when VitePress loads its config. A page you add while the server is
running is served at its URL but does not appear in the sidebar until you restart `pnpm start`.

### Checking Links

```bash
# from the repo root
pnpm lint:docs
```

This runs `docs-viewer/src/check-content-links.ts`, which renders every page in `guides/`,
`upgrading/`, `blog/`, `rfcs/`, and `warp-drive-packages/memory-alpha/skills/` and fails on any
link whose target page or `#anchor` does not exist. CI runs it in the lint job. It does not check
package `README.md` files, which are rendered by GitHub and npm rather than by this site, and it
does not catch markdown that fails to compile; only `pnpm build` does that. The most common
compile failure is a bare `<thing>` in prose, which VitePress parses as a Vue element. Put angle
brackets in code spans.

### Static Preview

To preview the built site without watching for changes, build it and then serve the output:

```bash
# full TypeDoc rebuild, then vitepress build
pnpm build

# serve the built output with vitepress preview
pnpm preview
```

### LLM-Friendly Markdown

`pnpm build` also writes, via `vitepress-plugin-llms` (see `.vitepress/config.mts`):

- an LLM-friendly `.md` twin of every page next to its `.html`, so `/guides/foo` is also
  `/guides/foo.md`
- `llms.txt` (a table of contents of those twins) and `llms-full.txt` (all of them in one file)

Links in those files are absolute, using the same `HOSTNAME` env var as the sitemap
(`https://canary.warp-drive.io` when unset; the production deploy sets `https://warp-drive.io`).
A page whose source is `foo/index.md` gets the URL `/foo/` but the twin `/foo.md`, so after the
build `src/emit-index-markdown.ts` also copies that twin to `/foo/index.md`. The **Copy page**
button on every page (`.vitepress/theme/CopyPageButton.vue`) fetches the twin for the current URL.
The human-facing summary is [`llm-docs.md`](./docs.warp-drive.io/llm-docs.md); agents get the same
rules from the `docs/read-the-docs-as-markdown` skill in `@warp-drive/memory-alpha`.

A page's frontmatter `description` becomes the text after its link in `llms.txt`, and content
wrapped in `<llm-only>` or `<llm-exclude>` tags is kept for or dropped from the Markdown outputs
respectively (and the reverse for the HTML site); see
[Writing Guides](../guides/contributing/writing-documentation/writing-guides.md#frontmatter-and-agent-only-content).
To validate a deployment, `npx llms-txt-check https://warp-drive.io` fetches the served `llms.txt`
and every URL it lists, and exits nonzero if any stopped serving.

Three things to know when testing this locally:

- Only `pnpm build` produces the twins and `llms*.txt`. The `pnpm start` dev server does not.
- The site's service worker answers navigations with `index.html` unless the URL is on its
  denylist, and `.md`/`.txt` were only added to that list in September 2026. A browser still
  holding an older worker gets a VitePress 404 for the first `.md` navigation, updates the worker
  in the background, and works from the next load on. When testing, unregister the worker first
  (DevTools → Application → Service Workers) rather than chasing a cache that isn't there.
- `pnpm preview` snapshots file sizes when it starts. After a rebuild, restart it, or it serves the
  new `sw.js` with the old `Content-Length` and the browser installs a truncated worker.

### PR Preview

Pull requests labeled `:label: doc`, `:label: feat`, or `:label: rfc` (the label names literally
contain `:label:`) get a full build of the site deployed to `https://canary.warp-drive.io/pr-preview/pr-<number>/`, linked from a sticky
comment on the PR. The preview deploys as soon as one of those labels is added, redeploys on each
push, and is removed when the label is removed or the PR closes. See
[`.github/workflows/pr-preview.yml`](../.github/workflows/pr-preview.yml).

### Deploying

The latest commit on main can be deployed to [docs.warp-drive.io](https://docs.warp-drive.io)
by manually triggering the GithubAction in [github.com/warp-drive-data/docs](https://github.com/warp-drive-data/docs/actions/workflows/deploy.yml)

