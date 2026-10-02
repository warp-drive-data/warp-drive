# Write a PR Blog Summary

Use this skill whenever you open a pull request against WarpDrive, change what an open PR does,
or change its changelog label. Some PRs add a short summary file to `.next-release-post/`: a few
sentences, written for users, that the next release blog post is drafted from. This skill decides
whether the PR needs one and writes it. The rules for the file itself — which labels require it,
how to name it, and what goes in it — live in
[Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries); read that section before
writing one.

## Steps

1. Find the PR's changelog label. If it has none yet, use the label you expect it to get from
   [Submit a PR](./submit-a-pr.md) step 6, which is also the label a `type(scope):` title maps to.
2. Look the label up in the table in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries):
   - **Required** — add the file.
   - **Only for...** — add it if the PR meets the condition in that row. If you can't tell
     whether a fix is one users would notice, ask the user rather than guessing; a summary on a
     routine fix crowds the post, and a missing one on a notable fix drops it from the post.
   - **Leave it out** — don't add a file, and delete one the PR already added.
3. Gather what a user needs before writing. Read the diff for the public surface it changes —
   exports, options, defaults, types, deprecation IDs — and the guides or API docs the PR adds or
   updates. Those docs pages are what the summary links to. Skip the implementation; the summary
   says what changed for a user, not how.
4. Look for an existing summary on the same topic before writing a new one. List
   `.next-release-post/` on a freshly fetched `origin/main` and read any file whose name or text
   covers the feature, API, or fix this PR changes — a follow-up fix, a perf pass, or an extension
   of something an earlier PR summarized. Update that file instead of adding a second one, so the
   post tells one story, but only if both of these hold:
   - It hasn't shipped. If the file exists at the latest stable release's tag, it's already been
     announced, and the next post only picks up files added since that tag. Write a new file
     instead.

     ```sh
     LATEST=$(git tag -l 'v[0-9]*' | grep -v -- '-' | sort -V | tail -1)
     git cat-file -e "$LATEST:.next-release-post/<file>" 2>/dev/null && echo shipped
     ```
   - This PR isn't being backported where the original wasn't. A PR carrying a `:dart:` label is
     cherry-picked onto release branches that may not have the file, and the cherry-pick then
     conflicts. Write a new file instead, and ask the user if you can't tell where the original
     shipped.
5. Write or update the file to the rules in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries). The reader has never
   seen the PR and will meet this text in a blog post next to other PRs' summaries, so:
   - open with the change itself, not with "This PR";
   - write it so it still reads correctly once the PR has shipped: present tense, no "will";
   - for `:label: breaking`, `:label: deprecation`, and `:label: cleanup`, say what users must
     change and link the upgrade or deprecation guide;
   - for `:label: perf`, name the workload that gets faster and by roughly how much, if the PR
     measured it.

   When updating, rewrite the summary so it describes the topic as it will ship, not as a list of
   changes: fold this PR's change into the existing text, keep the earlier PR's points that still
   hold, and drop any this PR makes untrue. Keep the file's name.
6. Commit it in the same PR as the change, as `.next-release-post/<topic>.md` directly in that
   directory with no subdirectory. A new file needs a name that doesn't exist at `$LATEST` from
   step 4; reusing a shipped summary's name makes the new file look like an edit to an announced
   one, and the next post skips it. Touch no other summary file than the one this PR adds or
   updates, and don't edit `README.md`.
7. Keep it current until the PR merges. When you push a change that alters the public behavior
   the summary describes, or the label changes, run steps 1–6 again: rewrite the file to match,
   or add or delete it. If this PR updated an existing summary and no longer needs to, restore
   that file to its text on `main` rather than deleting it. The post is drafted from whatever the
   file says when it merges.

## Example

A PR titled `feat(alien-signals): compose other frameworks' signals into the alien-signals graph`
carries `:label: feat`, so it adds `.next-release-post/alien-signals-composition.md`:

```md
Ember and React components on the same page can now share one store. Import
`@warp-drive/alien-signals/install` before each framework's own `install`, and every framework
re-renders when the data it read changes, including when a memo returns a cached value. See
[Using Ember and React on the Same Page](/guides/the-manual/cookbook/multiple-frameworks-on-one-page.md).
```

A later PR titled `perf(alien-signals): gate each memo with one signal per framework` carries
`:label: perf` and changes the same feature. Before that feature has shipped in a stable release,
it updates `alien-signals-composition.md`, adding a sentence on what gets faster, instead of
adding a second file. After it has shipped, it adds its own file.

A follow-up titled `chore(ci): replace the docs site root on each deploy` carries
`:label: chore`, so it adds no file.
