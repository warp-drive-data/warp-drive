# WarpDrive Contributors Skills — Agent Index

You are an AI agent contributing to WarpDrive's own codebase (not consuming `@warp-drive/*`
packages as a dependency in an app). Find the single row below that matches your task and read
**only** that file. Do not read other skill files, do not list or read whole directories.

| If you need to... | Read exactly |
| --- | --- |
| Begin any session or task in this repo — get a working copy to make changes in | `start-in-a-fresh-worktree.md` |
| You're about to write a commit message or open a pull request | `keep-commits-human-authored.md` |
| You're fixing a bug, adding a guard, or adding a fallback in WarpDrive's internals (`Store`, cache, graph, reactive signals, record arrays) | `fix-at-the-source.md` |
| You added or changed a test that mocks HTTP, and you're about to commit | `commit-mock-cache-fixtures.md` |
| You're writing a new RFC, or implementing one that's already been accepted | `writing-and-implementing-rfcs.md` |
| You're writing or changing documentation — a doc comment (TSDoc), a guide, an `upgrading/` or `blog/` page, a package README or `src/index.md`, or an agent skill (RFCs have their own row above) | `write-documentation.md` |
| You're about to run, or are about to reach for, any local test/lint/build command — even mid-task, even if you already read this table once this session for a different reason | `use-ci-as-the-source-of-truth.md` |
| You're writing or reviewing a test and about to share setup/teardown across more than one `test()` in a module | `extract-test-setup-into-functions.md` |

The first two rows apply to **every** session, whatever the task — read them before anything
else, then read the row matching your actual task.

Re-consult this table whenever your task's shape changes within the session, not only once at
the start. A session that starts as a docs or skill-writing task can turn into one that needs a
code change and a local check partway through — reading this table once, before that shift
happened, doesn't cover the row that now applies.

Each skill file is self-contained for its task and links out to any other skill file it
genuinely depends on — follow a link only if you hit the specific case it describes.

If nothing above matches, the skill you need doesn't exist yet in this category.
