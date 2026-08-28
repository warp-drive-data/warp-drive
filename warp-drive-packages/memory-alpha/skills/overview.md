# WarpDrive Agent Skills

This section packages WarpDrive knowledge for AI coding agents — Claude, Copilot, Cursor, and
similar tools — as small, focused, task-oriented skills.

Each skill is a single markdown file describing one thing to accomplish with WarpDrive: defining
a schema, making a request, handling a mutation, and so on. Skills are grouped into directories
by topic, the same way the [Guides](/guides/index.md) are, and published as the
[`@warp-drive/memory-alpha`](https://www.npmjs.com/package/@warp-drive/memory-alpha) npm
package — named after the Federation's central archive of all recorded knowledge, minus the
away-team incident that torched the original — so it can be installed into any project and
consumed by an MCP server, a Claude Code skill, or adapted into tool-specific instruction files
(Cursor rules, Copilot instructions, etc.).

Browse the categories in the sidebar to get started. If you're an AI agent rather than a human
reader, don't start here — read the package's `skills/index.md` (or its
[README](https://www.npmjs.com/package/@warp-drive/memory-alpha)) instead, which routes you
directly to the one file you need without loading this page or any directory listing.
