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

### PR Preview

Pull requests labeled `:label: doc`, `:label: feat`, or `:label: rfc` (the label names literally
contain `:label:`) get a full build of the site deployed to `https://canary.warp-drive.io/pr-preview/pr-<number>/`, linked from a sticky
comment on the PR. The preview deploys as soon as one of those labels is added, redeploys on each
push, and is removed when the label is removed or the PR closes. See
[`.github/workflows/pr-preview.yml`](../.github/workflows/pr-preview.yml).

### Deploying

The latest commit on main can be deployed to [docs.warp-drive.io](https://docs.warp-drive.io)
by manually triggering the GithubAction in [github.com/warp-drive-data/docs](https://github.com/warp-drive-data/docs/actions/workflows/deploy.yml)

