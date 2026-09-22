---
title: RFCs
---

# WarpDrive RFCs

WarpDrive participates in [Ember's RFC process](https://github.com/emberjs/rfcs/), but this
repository is the **source of truth** for WarpDrive-specific RFCs. Drafting, discussion, and
iteration happen here first, as a normal PR against `warp-drive-data/warp-drive`; a copy is
opened in `emberjs/rfcs` once the WarpDrive-side PR merges, and kept in sync in both directions
afterward. See [The RFC Process](/guides/contributing/rfc-process.md) for the full workflow, and
the [Writing and Implementing RFCs](/skills/contributors/writing-and-implementing-rfcs.md) skill
for the mechanics of drafting one.

## Numbering

RFCs here are numbered independently from `emberjs/rfcs`, starting at `0001`. Each RFC's
frontmatter records both numbers once the upstream copy exists:

- `warp-drive-rfc` — this repository's number (also the file's `000N-` prefix)
- `emberjs-rfc` / `emberjs-pr` — the corresponding RFC number and PR in `emberjs/rfcs`, filled in
  after the first sync

## Starting a new RFC

Copy [`0000-template.md`](/rfcs/0000-template.md) to the next available `000N-your-title.md`,
add its filename (without `.md`) to the `items` list in this directory's `_meta.json`, and
open a PR labeled `:label: rfc`. See the process and skill docs linked above for what happens
next.

The `_meta.json` step matters: the docs site sorts RFCs by title text unless `items` gives it an
explicit order, so a new RFC left out of that list won't sort where its number suggests.
