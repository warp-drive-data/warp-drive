# WarpDrive Contributors Skills — Agent Index

You are an AI agent contributing to WarpDrive's own codebase (not consuming `@warp-drive/*`
packages as a dependency in an app). Find the single row below that matches your task and read
**only** that file. Do not read other skill files, do not list or read whole directories.

| If you need to... | Read exactly |
| --- | --- |
| You're fixing a bug, adding a guard, or adding a fallback in WarpDrive's internals (`Store`, cache, graph, reactive signals, record arrays) | `fix-at-the-source.md` |

Each skill file is self-contained for its task and links out to any other skill file it
genuinely depends on — follow a link only if you hit the specific case it describes.

If nothing above matches, the skill you need doesn't exist yet in this category.
