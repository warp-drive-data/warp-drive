# Internal Docs Viewer

## docs.warp-drive.io

### Development

From this root directory, run:

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

### Deploying

The latest commit on main can be deployed to [docs.warp-drive.io](https://docs.warp-drive.io)
by manually triggering the GithubAction in [github.com/warp-drive-data/docs](https://github.com/warp-drive-data/docs/actions/workflows/deploy.yml)

