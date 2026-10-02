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
4. Write the file to the rules in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries). The reader has never
   seen the PR and will meet this text in a blog post next to other PRs' summaries, so:
   - open with the change itself, not with "This PR";
   - write it so it still reads correctly once the PR has shipped: present tense, no "will";
   - for `:label: breaking`, `:label: deprecation`, and `:label: cleanup`, say what users must
     change and link the upgrade or deprecation guide;
   - for `:label: perf`, name the workload that gets faster and by roughly how much, if the PR
     measured it.
5. Commit it as `.next-release-post/<topic>.md`, directly in that directory with no
   subdirectory, in the same PR as the change. Don't touch other PRs' files there, and don't edit
   `README.md`.
6. Keep it current until the PR merges. When you push a change that alters the public behavior
   the summary describes, or the label changes, run steps 1–5 again: rewrite the file to match,
   or add or delete it. The post is drafted from whatever the file says when it merges.

## Example

A PR titled `feat(alien-signals): compose other frameworks' signals into the alien-signals graph`
carries `:label: feat`, so it adds `.next-release-post/alien-signals-composition.md`:

```md
Ember and React components on the same page can now share one store. Import
`@warp-drive/alien-signals/install` before each framework's own `install`, and every framework
re-renders when the data it read changes, including when a memo returns a cached value. See
[Using Ember and React on the Same Page](/guides/the-manual/cookbook/multiple-frameworks-on-one-page.md).
```

A follow-up titled `chore(ci): replace the docs site root on each deploy` carries
`:label: chore`, so it adds no file.
