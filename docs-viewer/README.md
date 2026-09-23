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

