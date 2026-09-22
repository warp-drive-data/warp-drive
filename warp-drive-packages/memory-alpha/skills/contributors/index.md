# WarpDrive Contributors Skills — Agent Index

You are an AI agent contributing to WarpDrive's own codebase (not consuming `@warp-drive/*`
packages as a dependency in an app). Find the single row below that matches your task and read
**only** that file. Do not read other skill files, do not list or read whole directories.

| If you need to... | Read exactly |
| --- | --- |
| Begin any session or task in this repo — get a working copy to make changes in | `start-in-a-fresh-worktree.md` |
| You're about to write a commit message or open a pull request | `keep-commits-human-authored.md` |
| You're fixing a bug, adding a guard, or adding a fallback in WarpDrive's internals (`Store`, cache, graph, reactive signals, record arrays) | `fix-at-the-source.md` |
| You're writing a new RFC, or implementing one that's already been accepted | `writing-and-implementing-rfcs.md` |
| You're writing or changing documentation — a TSDoc comment, a guide, an `upgrading/` or `blog/` page, a README, or an agent skill | `write-documentation.md` |
| You're ready to test a change — about to run checks locally, or decide whether a PR is ready for review | `use-ci-as-the-source-of-truth.md` |

The first two rows apply to **every** session, whatever the task — read them before anything
else, then read the row matching your actual task.

Each skill file is self-contained for its task and links out to any other skill file it
genuinely depends on — follow a link only if you hit the specific case it describes.

If nothing above matches, the skill you need doesn't exist yet in this category.
