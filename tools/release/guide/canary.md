# Canary Release Guide

## Automated Workflow

The [0. Release](../../.github/workflows/release.yml) workflow's `canary` job should be used to publish all new canaries, triggered via `workflow_dispatch` (channel: `canary`) from the [Actions tab](https://github.com/warp-drive-data/warp-drive/actions/workflows/release.yml).

This workflow trigger is restricted to project maintainers.

For the first release of a new cycle, manually running this flow with the increment as either `major` or `minor` is required.

Subsequent pre-release versions will be auto-released on a chron schedule.


## Local Dry Runs

Publishing itself requires npm's Trusted Publishing (OIDC), which is only available from within
the GitHub Actions release workflow above -- there is no local/manual publish path.

You can still preview what a release would do with a local dry run. Ensure you have bun, node
and pnpm configured correctly (mise is preferred for managing node and pnpm versions; for bun,
any `1.x` version should work but minimum version should ideally match the installed
`bun-types` dependency in `package.json`), then run:

```ts
bun release publish canary -i <patch|major|minor> --dry-run
```

Run `bun release help` for additional options.
