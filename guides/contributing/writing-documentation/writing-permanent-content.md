---
title: Writing Permanent Content
---

# Writing Permanent Content

[Upgrading](/upgrading/) and [Blog](/blog/) are different from the rest of the guides: they hold
point-in-time content whose URLs are a permanent contract with readers, not just the current
best explanation of a concept. Follow these rules when adding to either section.

Of the [audiences](./index.md#know-your-audience) our documentation serves, these pages are for
existing users. An upgrade guide may presume knowledge of the concepts being replaced but never of
the ones replacing them. A blog post should say near the top who it is for. LLMs and coding agents
also land on these pages, years later and out of order, and will present whatever they find as
current unless the page's version and date say otherwise; that is the reason for the rule below.

## URLs are never renamed or unpublished

Once a page under `upgrading/` or `blog/` is published, its path doesn't change and the page is
never deleted, even after its content is out of date.

If a page's content is fully superseded (a newer major-version guide replaces it, a post is
factually wrong, etc.), don't delete or move it. Instead:

1. Replace its body with a short pointer to the replacement, wrapped in a `:::danger` callout.
   Keep the frontmatter `title` and the `<SinceBadge>` line so the page still says what it was:

   ```md
   :::danger **We've moved!**
   This guide has [moved](/upgrading/v6/index.md)
   :::
   ```

2. Add `draft: true` to its frontmatter. This hides the page from the sidebar and nav (so it
   doesn't clutter navigation for current readers) while leaving the page itself published at its
   original URL. `draft` behaves the same way for `guides/`; only the synced agent skills under
   `warp-drive-packages/memory-alpha/skills/` have their `draft` pages removed from the site
   entirely.

## Every page is dated and versioned

Record the ***Warp*Drive*** version and the date a page was written for near the top of the page,
as a `<SinceBadge>` followed by the date (`YYYY-MM-DD`) it was authored or last meaningfully
revised:

```md
<SinceBadge version="5.0.0" /> &nbsp; authored 2023-06-10
```

This lets a reader who lands on an old search result or bookmark know immediately whether the
page still applies to the version they're using.

## Organize by major version

Each section is sub-divided by major version (`upgrading/v5/`, `blog/v5/`, `upgrading/v6/`, ...).
Within a major version's directory:

- `upgrading/<major>/` holds that version's upgrade guide plus any deprecation or
  feature-specific migration guides written against it.
- `blog/<major>/` holds posts published while that major version was current.

Add new major-version directories to the section's root `_meta.json` `items` list so they sort
in release order rather than alphabetically.
