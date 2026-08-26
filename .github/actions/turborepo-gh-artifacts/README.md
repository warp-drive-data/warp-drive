# TurboRepo Github Artifacts action

This action allows you to use Github artifacts as [TurboRepo](https://github.com/vercel/turborepo) remote cache server.

## How it works?

It's starts a local TurboRepo server (on port `9080`) and uses Github artifacts as a caching storage.

## Setup

1. Add in your `workflow.yml` the following section **before** TurboRepo runs:

   ```yaml
   - name: TurboRepo local server
     uses: felixmosh/turborepo-gh-artifacts@v4
     with:
       repo-token: ${{ secrets.GITHUB_TOKEN }}
   ```

2. Make turbo repo work with the local server

   Enable `turbo` remote caching though environment variables.

   ```yaml
   - name: Build
     run: yarn build
     env:
       TURBO_API: 'http://127.0.0.1:9080'
       TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
       TURBO_TEAM: 'foo'
   ```

That's it 😋.

### Action inputs

The action has 1 **required** inputs:
- `repo-token` - A Github token with `repo` permission, usually the default `secrets.GITHUB_TOKEN` is enough.

Pay ❤️, `GITHUB_TOKEN` must have [`actions: read`](https://docs.github.com/en/rest/reference/actions#get-an-artifact) permissions in order to be able to read repo's existing artifacts.

## Working Example

[Working example](https://github.com/felixmosh/turborepo-gh-artifacts-example) of the entire setup, based on `npx create-turbo@latest`.

## Useful Links

- [About the GITHUB_TOKEN secret](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret)
- [TurboRepo Caching](https://turborepo.org/docs/features/caching)
- [TurboRepo Remote Caching (Beta)](https://turborepo.org/docs/features/remote-caching)
