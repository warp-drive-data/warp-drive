# Write a PR Blog Summary

Use this skill whenever you open a pull request against WarpDrive, change what an open PR does,
or a reviewer asks for a summary or asks for one to come out. Some PRs add a short summary file
to `.next-release-post/`: a few sentences, written for users, that the next release blog post is
drafted from. This skill decides whether to propose one and writes it. The rules for the file
itself — which changes are usually worth one, how to name it, and what goes in it — live in
[Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries); read that section before
writing one.

## Steps

1. Decide whether to propose a summary, using the guidance in
   [Blog Summaries](/guides/contributing/submitting-prs.md#blog-summaries): would someone using
   ***Warp*Drive** want to hear about this change in a release post? The changelog label is a
   hint, not the rule: a `:label: feat` or `:label: breaking` PR almost always is, a
   `:label: chore` PR almost never. If you can't tell, ask the user rather than guessing; a
   summary on a routine change crowds the post, and a missing one on a notable change drops it.
2. Defer to review. The PR's reviewer decides whether it keeps a summary: if they ask for one,
   write it; if they ask for it to come out, delete the file; if they ask for changes, make them.
   Mention in the PR description that the PR adds a summary, so the reviewer knows to read it.
3. Gather what a user needs before writing. Read the diff for the public surface it changes —
   exports, options, defaults, types, deprecation IDs — and the guides or API docs the PR adds or
   updates. Those docs pages are what the summary links to. Skip the implementation; the summary
   says what changed for a user, not how.
4. Look for an existing summary on the same topic before writing a new one. List
   `.next-release-post/` on a freshly fetched `origin/main` and read any file whose name or text
   covers the feature, API, or fix this PR changes — a follow-up fix, a perf pass, or an extension
   of something an earlier PR summarized. Update that file instead of adding a second one, so the
   post tells one story, but only if both of these hold:
   - It hasn't shipped. If the file appears in the latest stable release's history, it's already
     been announced, and the next post skips any summary that has. Write a new file for this PR
     instead.

     ```sh
     LATEST=$(git tag -l 'v[0-9]*' | grep -v -- '-' | sort -V | tail -1)
     git log -1 --format=%h "$LATEST" -- .next-release-post/<file> | grep -q . && echo shipped
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
   - for a breaking change, a deprecation, or a removal, say what users must change and link the
     upgrade or deprecation guide;
   - for a performance improvement, name the workload that gets faster and by roughly how much, if
     the PR measured it.

   When updating, rewrite the summary so it describes the topic as it will ship, not as a list of
   changes: fold this PR's change into the existing text, keep the earlier PR's points that still
   hold, and drop any this PR makes untrue. Keep the file's name, which carries the PR that
   introduced it.
6. Commit it in the same PR as the change. A new file goes directly in that directory, with no
   subdirectory, as `.next-release-post/<PR number>-<topic>.md` using this PR's number, so open
   the PR first (as a draft, per [Submit a PR](./submit-a-pr.md)) and push the file in a commit
   after it. Touch no other summary file than the one this PR adds or updates, and don't edit
   `README.md`.
7. Keep it current until the PR merges. When you push a change that alters the public behavior
   the summary describes, run steps 1–6 again: rewrite the file to match,
   or add or delete it. If this PR updated an existing summary and no longer needs to, restore
   that file to its text on `main` rather than deleting it. The post is drafted from whatever the
   file says when it merges.

## Example

A PR titled `feat(alien-signals): compose other frameworks' signals into the alien-signals graph`
adds a feature users of more than one framework will want to hear about, so once it's open as
#11394 it adds
`.next-release-post/11394-alien-signals-composition.md`:

```md
Ember and React components on the same page can now share one store. Import
`@warp-drive/alien-signals/install` before each framework's own `install`, and every framework
re-renders when the data it read changes, including when a memo returns a cached value. See
[Using Ember and React on the Same Page](/guides/the-manual/cookbook/multiple-frameworks-on-one-page.md).
```

A later PR titled `perf(alien-signals): gate each memo with one signal per framework` makes the
same feature faster. Before that feature has shipped in a stable release,
it updates `11394-alien-signals-composition.md`, adding a sentence on what gets faster, instead of
adding a second file. After it has shipped, it adds its own file, `11401-<topic>.md`.

A follow-up titled `chore(ci): replace the docs site root on each deploy` changes nothing a user
sees, so it adds no file.
