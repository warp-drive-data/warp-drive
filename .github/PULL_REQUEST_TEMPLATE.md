<!-- Thank you for opening up this PR! -->

If this PR updates API docs, preview them by:

- install [mise](https://mise.jdx.dev/getting-started.html) and run `mise install` in the root (optional, but recommended -- this pins the correct node/pnpm/bun versions for you)
- if you aren't using mise, install [pnpm](https://pnpm.io/installation) `12` yourself (bun will be installed automatically by mise or by pnpm as needed)
- run `pnpm install` in the root (if needed)
- run `pnpm preview` in the root

If this PR is not from a fork and is labeled `:label: doc`, `:label: feat`, or `:label: rfc`, a live preview is also deployed automatically and linked in a comment on this PR -- no local setup required. (Fork PRs don't support automatic previews yet.)

---

- Read the full [contributing documentation](https://canary.warp-drive.io/guides/contributing/become-a-contributor)
- A changelog label (e.g. `:label: feat`) is applied automatically if your title starts with
  `feat:`, `feat |`, or `[feat]` (and similarly for the other [changelog labels](https://canary.warp-drive.io/guides/contributing/submitting-prs#changelog-labels)) and no changelog label exists yet. If you do not have
  permission to add labels or run the test-suite in CI, a team member will do the rest for you.
