# RFC sync bot

Keeps this repo's [`rfcs/`](../../rfcs) in sync with `emberjs/rfcs`, in both directions, without
ever giving anything direct write access to `emberjs/rfcs` itself. See
[the RFC-writing skill](../../warp-drive-packages/memory-alpha/skills/contributors/writing-and-implementing-rfcs.md)
for how this looks from a contributor's side, and
[The RFC Process](../../guides/contributing/rfc-process.md) for the overall workflow.

## How it works

- A dedicated bot account owns a persistent fork of `emberjs/rfcs`. Every outbound PR is opened
  `bot-fork:branch → emberjs/rfcs:main` with `maintainer_can_modify: true`, which is what lets
  Ember reviewers push suggested-change commits onto the PR without granting anyone write access
  to either base repo.
- **Outbound** (`.github/workflows/rfc-sync-outbound.yml`, on push to `main` touching `rfcs/**`):
  `push-outbound.mjs` opens a new PR for a brand-new RFC, or pushes an update to the fork branch
  backing an already-open PR. Either way the commit's author is set to whoever actually wrote the
  change in this repo (via `git commit --author`) -- the bot only ever appears as committer.
- **Inbound** (`.github/workflows/rfc-sync-inbound.yml`, scheduled): `pull-inbound.mjs` polls each
  mirrored RFC's fork branch for commits the bot didn't make itself (e.g. a reviewer's applied
  suggestion), and opens a PR back into `warp-drive-data/warp-drive` with that change, crediting
  the real upstream author.
- Nothing is ever auto-merged on either side. Every sync is a PR for a human to review.

## One-time setup (not doable from an agent session -- needs a human with org access)

1. Create a dedicated bot GitHub account (e.g. `warpdrive-bot`) -- don't reuse a personal or
   existing deploy account, so its access stays scoped to exactly this.
2. Have that account fork `emberjs/rfcs` (`gh repo fork emberjs/rfcs --remote=false`, run as the
   bot account, or via the GitHub UI). The fork can be renamed freely (nothing here assumes it's
   still called `rfcs`) -- only the `owner/repo` value matters, recorded in step 4.
3. Generate a **classic** personal access token for the bot account, scoped to **`public_repo`**
   only (not full `repo`, and no other scopes).

   A **fine-grained** token cannot be used for the `emberjs/rfcs` side of this: fine-grained
   tokens can only be scoped to repositories the token's own account already has some access to
   (owns, collaborates on, or belongs to via an org) -- a bot account with no relationship to the
   `emberjs` org will never be able to select `emberjs/rfcs` in that picker, no matter what
   permission level you ask for. `public_repo` is the standard workaround every bot that opens
   PRs against a third-party public repo it doesn't collaborate on has to use. It's broader than
   the fine-grained, read-only-on-contents scoping this was originally written around -- the
   token *can* technically act on any public repo, not just `emberjs/rfcs` and the bot's own fork
   -- but it still can never touch a private repo, and its blast radius is capped at "open PRs /
   push to repos this account could already interact with anyway." If `emberjs/rfcs`'s
   maintainers are ever willing to install a purpose-built GitHub App scoped to just that repo
   (Pull requests: read/write, Contents: read), that would be a strict improvement over this
   token and worth switching to -- but that requires their cooperation, not just ours.
4. In `warp-drive-data/warp-drive`'s repo settings, add:
   - Secret `EMBERJS_RFCS_SYNC_TOKEN` -- the token from step 3
   - Secret or variable `EMBERJS_RFCS_SYNC_FORK` -- the fork's `owner/repo`, e.g.
     `warpdrive-bot/emberjs-rfcs`
   - Secret or variable `EMBERJS_RFCS_SYNC_NAME` / `EMBERJS_RFCS_SYNC_EMAIL` -- the bot's git
     identity (same pattern as `GH_DEPLOY_NAME`/`GH_DEPLOY_EMAIL` in `release.yml`); use the bot
     account's GitHub-provided `@users.noreply.github.com` address for the email so a real inbox
     never appears in public commit history

Until these are set, both workflows detect the missing configuration, log it, and exit
successfully (no CI failures, no partial syncing).

## Adopting an RFC that predates the bot

RFC 1 and RFC 2 in this repo (`rfcs/0001-*.md`, `rfcs/0002-*.md`) were mirrored to `emberjs/rfcs`
by hand before this bot existed, from a fork the bot doesn't control. Their `emberjs-branch`
frontmatter field is intentionally left blank. Once the bot's fork exists, a maintainer needs to
either:

- transfer/re-point those PRs' branches to live in the bot's fork (if the original author is
  willing), and fill in `emberjs-branch` accordingly, or
- let the outbound sync open fresh PRs for them (as if they were new), and close the original
  hand-opened PRs in favor of the bot-opened ones, linking between them for history.

`push-outbound.mjs` logs a warning and skips any file with `emberjs-rfc` set but `emberjs-branch`
blank, rather than guessing.

## Known limitations

- The frontmatter parser in `common.mjs` is hand-rolled for this repo's specific schema, not a
  general YAML parser -- see the comment at the top of that file.
- `push-outbound.mjs`/`pull-inbound.mjs` process every tracked RFC file on each run rather than
  only ones the triggering push/schedule actually touched; this is fine at RFC-sized volumes (a
  handful of files, not hundreds) and keeps the scripts simple, but would need revisiting if the
  number of concurrently-open RFCs grows very large.
- Nothing here has been exercised against the real `emberjs/rfcs` repo -- it can't be, without the
  bot account and token from the setup section above. Review the scripts closely before the first
  real run, and consider a dry run against a disposable fork first.
