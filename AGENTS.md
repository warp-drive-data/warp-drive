# Agent Instructions

This repo's knowledge base for AI coding agents is [`@warp-drive/memory-alpha`](./warp-drive-packages/memory-alpha),
shipped as plain markdown at `warp-drive-packages/memory-alpha/skills/`.

Working in this repo means you are contributing to WarpDrive itself, so start at the contributor
index. Do not start at the top-level skills index — that one routes apps consuming
`@warp-drive/*` as a dependency.

Before starting any task in this repo:

1. Read [`warp-drive-packages/memory-alpha/skills/contributors/index.md`](./warp-drive-packages/memory-alpha/skills/contributors/index.md).
   Its first row applies to every session whatever the task — read that skill before you touch
   anything else.
2. Find the single row that matches your task and read **only** that file.
3. If your task is about *using* WarpDrive's public API rather than changing its internals — a
   test app, a docs example, a guide snippet — the consumer index at
   [`warp-drive-packages/memory-alpha/skills/index.md`](./warp-drive-packages/memory-alpha/skills/index.md)
   carries those rows (schemas, requests). Go there only in that case.
4. If nothing matches, the skill doesn't exist yet — proceed using your own judgment and the
   surrounding code/docs as usual.

Do not browse the rest of `warp-drive-packages/memory-alpha/skills/` or read whole
directories beyond what an index tells you to load — the indexes are enough to route you.
