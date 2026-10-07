---
releases: ["5.10"]
---
`@warp-drive/memory-alpha`, the package of plain-markdown skills that teaches AI coding agents
how to use ***Warp*Drive**, covers more ground and is easier to wire into an app:

- New skills for writing request builders as a typed, documented SDK for your API, for setting up
  `@warp-drive/holodeck` and mocking requests in tests (including when to use `RECORD`), and for
  looking up any guide or API page as Markdown through `llms.txt`.
- The fetching skill now steers agents to app-specific builders instead of inline request objects,
  and shows reading a request's state in JavaScript with `getRequestState`.
- The routing table warns agents that the skills may describe a newer version than the app has
  installed, and that an app's own wrappers and docs take precedence.
- The README gives a short block to paste into your app's `AGENTS.md` after
  `pnpm add -D @warp-drive/memory-alpha`. The repo's own agent files are for contributors and
  shouldn't be copied into an app.

Browse the skills in the [Skills](/skills/) section of the docs site.
