# Submit a PR

Use this skill when a change is ready to leave your worktree and become a pull request against
WarpDrive. It encodes [Submitting PRs](/guides/contributing/submitting-prs.md) plus the label
checks CI runs on every PR, so a PR opened this way passes those checks on the first run.

## Steps

1. Target `main`. Every PR opens against `main`, even a fix that must also reach a published
   release. For those, land the `main` PR first, then cherry-pick the merged commit into a
   second PR against the release branch (`beta`, `release`, `lts-4-12`, and so on). Do not open
   the release-branch PR first.
2. Ship tests with the change. A bug fix carries a test that fails without the fix and passes
   with it. Test deprecation and assertion messages with `assert.expectDeprecation()` and
   `assert.expectAssertion()`; each test app's `test-helper.ts` installs them on QUnit's
   `assert` via `configureAsserts` from
   `@ember-data/unpublished-test-infra/test-support/asserts/index`. CI runs every test app in
   both development and production builds, and production strips assertions, deprecations, and
   warnings. Wrap any expectation about those in `if (DEBUG)`, with `DEBUG` imported from
   `@warp-drive/core/build-config/env`. `testInDebug` is the older form of the same guard and
   survives only in `tests/dont-write-new-tests-here`; do not add tests there.
3. Run the affected test app both ways before you push. From `tests/<app>`, run `pnpm test`,
   then `pnpm test:production`. On a first contribution a maintainer has to approve the CI
   workflow run, so a local run is the only signal you get until then.
4. Update every guide, API doc, and example the change affects, in the same PR. The rules for
   each kind of page are in
   [Writing Documentation](/guides/contributing/writing-documentation/index.md).
5. Title the PR in Conventional Commits form, `type(scope): subject`, in the imperative and
   without a trailing period. The title becomes the squash commit and the changelog line, so it
   must say what changed for a reader who never opens the PR.
6. Label the PR, or name the labels in the PR body. CI on `main` blocks a PR until it carries
   both a changelog label and a target label; the exact lists live in
   `.github/workflows/enforce-pr-labels-canary.yml`, and the changelog mapping in the root
   `package.json` under `changelog.labels`. Only maintainers can apply labels. If you cannot,
   write the two labels you expect in the PR body so a maintainer can apply them without
   re-reading the diff.

   Pick exactly one changelog label:

   | Label | Use for |
   | --- | --- |
   | `:label: breaking` | a breaking change |
   | `:label: feat` | a new public feature or behavior |
   | `:label: bug` | a fix for a reported issue |
   | `:label: perf` | a meaningful performance improvement |
   | `:label: cleanup` | removal of a deprecated feature, or a deprecation that became an assertion |
   | `:label: deprecation` | a new deprecation |
   | `:label: doc` | a fix or improvement to guides or API docs |
   | `:label: test` | new tests, or a refactor of existing tests |
   | `:label: chore` | internal refactoring with no public API change worth calling out |
   | `:label: dependencies` | a dependency bump on `main`; also satisfies the target check on its own |

   Then pick target labels. `:dart: canary` means no backport. Otherwise add one `:dart:` label
   per release channel that needs the change: `:dart: beta`, `:dart: release`, `:dart: lts`,
   `:dart: lts-prev`. Maintainers search these while releasing and remove each one once its
   backport PR is open.

   Never add a `backport-*` label to a `main` PR; CI bans them there. `:label: doc` and
   `:label: feat` also trigger a live docs preview, linked in a PR comment.
7. For the backport PR itself, cherry-pick onto the release branch and open the PR against that
   branch. CI adds the matching `backport-beta`, `backport-release`, `backport-lts`, or
   `backport-lts-prev` label. For an older non-LTS release branch, add `backport-old-release`
   yourself. Those PRs need a changelog label too, and CI bans the `:dart:` labels on them.
8. Discuss first when the change adds or alters public API. Open the conversation with the
   [team](https://emberjs.com/team/) before the implementation goes deep, and for anything
   larger than a fix follow the [RFC process](/guides/contributing/rfc-process.md).

## Example

A one-line docs fix opens against `main` titled `docs(upgrading): fix the LegacyMode link`
with the labels `:label: doc` and `:dart: canary`. With only `:label: doc`, the
`enforce-target-label` check fails and stays failed until someone adds `:dart: canary`.
That is exactly how [#11146](https://github.com/warp-drive-data/warp-drive/pull/11146) opened.
