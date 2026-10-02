---
releases: ["5.9"]
---
`@warp-drive/memory-alpha` is a new package of WarpDrive knowledge for AI coding agents such as
Claude Code, Codex, Copilot, Cursor and Gemini. It has no code: it ships a `skills/` directory of
small, task-focused markdown files, starting with defining a resource schema and fetching and
caching data through the `Store`, plus a `skills/index.md` routing table that sends an agent
straight to the one file matching its task. Install it and point your agent
at it — copy the instruction file for your agent from the package README (`CLAUDE.md`,
`AGENTS.md`, `GEMINI.md`, Copilot instructions or a Cursor rule) and set its path to
`node_modules/@warp-drive/memory-alpha/skills/index.md`, or serve the `skills/` directory from an
MCP server. The same skills are readable by humans in the new [Skills](/skills/) section
of the docs site.
