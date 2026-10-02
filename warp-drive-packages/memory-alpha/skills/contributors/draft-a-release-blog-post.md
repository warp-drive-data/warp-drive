# Draft a Release Blog Post

Use this skill whenever you're asked to draft a blog post announcing a WarpDrive release:
summarizing what changed in a given version for the people who use it. The release notes in
`CHANGELOG.md` are already generated from PR titles during the release; the post is something
else — a short, readable account of the few changes in the release worth a user's attention,
built from the `## Blog Summary` sections PRs carry (see
[Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries)).

The post is a page under `blog/`, so [Write Documentation](./write-documentation.md) governs
how to draft it with the user and check it, and
[Upgrading and Blog Pages](/guides/contributing/writing-documentation/writing-guides.md#upgrading-and-blog-pages)
sets its rules for location, frontmatter, and dating. Read both before step 5.

## Steps

1. Confirm the version with the user, and which release it compares against: normally the
   previous minor (`v5.10.0` against `v5.9.0`), so the post covers every pre-release in between.
   Patch releases rarely get a post; ask before writing one.
2. List the PRs in the release.
   - If the version is published, its section in the root `CHANGELOG.md` (`## v5.10.0 (date)`)
     lists every labeled PR, grouped by changelog label, plus the committers.
   - If it isn't published yet, list the PRs merged into `main` since the base release was cut,
     from GitHub with whatever access you have, and read each one's labels there. Tell the user
     the list is provisional until the release exists.
3. Collect the summaries. For each PR, fetch its labels and description from GitHub and keep it
   only if its changelog label is one the table in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries) gates in. Read the
   label from GitHub, not from the summary's presence: a PR relabeled to `:label: chore` after
   its summary was written is out. From each PR kept, take the text under its `## Blog Summary`
   heading, up to the next `##` heading.
4. Fill the gaps, and say what you filled. Releases from before PRs carried summaries, and PRs
   whose author skipped one, have a gated label and no section. For a required label, write a
   summary from the PR's title, description, and the docs it changed, following the same rules,
   and list those PRs for the user so they can check your reading. For an optional label
   (`:label: bug`, `:label: doc`) with no summary, leave the PR out unless the user asks for it.
5. Agree the outline with the user before drafting prose, as step 4 of
   [Write Documentation](./write-documentation.md) asks. Propose which summaries lead and which
   go — a post with twenty equally weighted items is a changelog. The default shape:
   - An opening paragraph: the version, who the post is for, and the one or two changes that
     matter most.
   - `## Breaking Changes`, `## New Features`, `## Performance`, `## Deprecations`,
     `## Removals`, `## Notable Fixes`, `## Documentation`, in that order, each only if it has
     entries. Group related PRs under one `###` heading per change rather than one per PR; a
     feature and its follow-up fixes are one story.
   - `## Upgrading`: link the upgrade and deprecation guides any entry above needs. Leave this
     section out if no entry asks users to change anything.
   - `## Thanks`: the committers from the version's `CHANGELOG.md` section, and a link to the
     full release notes for that version.
6. Turn summaries into prose. Rewrite each summary to fit the post instead of pasting it: merge
   overlapping summaries, keep their links, and link each change to its PR (`[#11394](...)`) so a
   reader can dig in. Don't add claims a summary or PR doesn't support — no invented benchmark
   numbers, dates, or roadmap promises; ask the user if the post seems to need one.
7. Write the page where
   [Organize by Major Version](/guides/contributing/writing-documentation/writing-guides.md#organize-by-major-version)
   puts it, `blog/v<major>/warp-drive-<major>-<minor>.md` (for example
   `blog/v5/warp-drive-5-10.md`), and never rename it once published. Give it a frontmatter
   `title`, `description`, and `date`, and the `<SinceBadge>` line, as
   [Every Page Is Dated and Versioned](/guides/contributing/writing-documentation/writing-guides.md#every-page-is-dated-and-versioned)
   describes. Add the post to its directory's `index.md` list and to the `items` in its
   `_meta.json`, newest first after `index`.
8. Finish with steps 5 and 6 of [Write Documentation](./write-documentation.md): reader-test the
   post as an existing user, run its checks, and open the PR with `:label: doc` per
   [Submit a PR](./submit-a-pr.md). The post's own PR carries no blog summary.
