# Write a PR Blog Summary

Use this skill whenever you open a pull request against WarpDrive, edit an existing PR's
description, or change a PR's changelog label. Some PRs carry a `## Blog Summary` section in
their description: a few sentences, written for users, that the release blog post is later
drafted from. This skill decides whether the PR needs one and writes it. The rules for the
section itself — which labels require it and what goes in it — live in
[Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries); read that section
before writing one.

## Steps

1. Find the PR's changelog label. If it has none yet, use the label you expect it to get from
   [Submit a PR](./submit-a-pr.md) step 6, which is also the label a `type(scope):` title maps to.
2. Look the label up in the table in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries):
   - **Required** — write the section.
   - **Only for...** — write it if the PR meets the condition in that row. If you can't tell
     whether a fix is one users would notice, ask the user rather than guessing; a summary on a
     routine fix crowds the post, and a missing one on a notable fix drops it from the post.
   - **Leave it out** — don't add the section, and remove one that is already there.
3. Gather what a user needs before writing. Read the diff for the public surface it changes —
   exports, options, defaults, types, deprecation IDs — and the guides or API docs the PR adds or
   updates. Those docs pages are what the summary links to. Skip the implementation; the summary
   says what changed for a user, not how.
4. Write the section to the rules in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries). The reader has never
   seen the PR and will meet this text in a blog post next to other PRs' summaries, so:
   - open with the change itself, not with "This PR";
   - write it so it still reads correctly once the PR has shipped: present tense, no "will";
   - for `:label: breaking`, `:label: deprecation`, and `:label: cleanup`, say what users must
     change and link the upgrade or deprecation guide;
   - for `:label: perf`, name the workload that gets faster and by roughly how much, if the PR
     measured it.
5. Put it in the PR description under exactly the heading `## Blog Summary`, as its own section,
   with no other `##` heading inside it. The release post finds the summary by that heading and
   reads everything up to the next `##`, so a renamed heading or a nested `##` loses or truncates
   it. Keep the rest of the description as [Submit a PR](./submit-a-pr.md) describes; the summary
   doesn't replace the explanation reviewers need.
6. Keep it current until the PR merges. When you edit the description, push a change that alters
   the public behavior the summary describes, or the label changes, run steps 1–5 again: rewrite
   the summary to match, or add or remove it. The post is drafted from whatever the merged PR's
   description says, so a stale summary ships stale.

## Example

A PR titled `feat(alien-signals): compose other frameworks' signals into the alien-signals graph`
carries `:label: feat`, so it needs a summary. Its description ends with:

```md
## Blog Summary

Ember and React components on the same page can now share one store. Import
`@warp-drive/alien-signals/install` before each framework's own `install`, and every framework
re-renders when the data it read changes, including when a memo returns a cached value. See
[Using Ember and React on the Same Page](/guides/the-manual/cookbook/multiple-frameworks-on-one-page.md).
```

A follow-up titled `chore(ci): replace the docs site root on each deploy` carries
`:label: chore`, so it gets no section.
