---
title: AI Coding Agents
description: Give your coding agent WarpDrive's skills by installing @warp-drive/memory-alpha and pointing its instructions file at the skills index, and find the docs as plain Markdown.
---

# AI Coding Agents

[`@warp-drive/memory-alpha`](/api/@warp-drive/memory-alpha/) packages what a coding agent needs to
know about ***Warp*Drive** as plain Markdown "skills": short instructions for tasks such as
defining a resource schema, fetching data through the `Store` or mocking requests in tests. The
package has no code and no dependencies, so it is a dev dependency.

::: code-group

```sh [pnpm]
pnpm add -E -D @warp-drive/memory-alpha@latest
```

```sh [npm]
npm add -E -D @warp-drive/memory-alpha@latest
```

```sh [yarn]
yarn add -E -D @warp-drive/memory-alpha@latest
```

```sh [bun]
bun add --exact --dev @warp-drive/memory-alpha@latest
```

:::

## Point Your Agent at the Skills

The skills are routed by one table, `skills/index.md`: the agent finds the row matching its task
and reads only that file. Tell your agent to start there in the instructions file it reads, such
as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` or `.github/copilot-instructions.md`:

```md [AGENTS.md]
This app uses WarpDrive. Before working on its data layer, read
`node_modules/@warp-drive/memory-alpha/skills/index.md`, find the single row that matches your
task and read only that file.
```

The [skills](/skills/) are also published on this site, so you can read what your agent is being
told.

## Read the Docs as Markdown

Every page of these docs is also published as plain Markdown, indexed in `llms.txt`, for agents
that need something no skill covers.
[LLM Optimized Documentation](https://warp-drive.io/llm-docs) lists the files.
