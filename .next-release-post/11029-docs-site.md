---
releases: ["5.10"]
---
The docs site at warp-drive.io picks up several improvements:

- Two new top-level sections with permanent URLs: [Upgrading](/upgrading/index.md), now home to
  the 4.x to 5.x upgrade guide, two-store migration and codemods (old `guides/migrating/` links
  redirect), and a [Blog](/blog/index.md) that lists posts newest first and publishes an RSS feed
  at `/blog/feed.xml`.
- A **Copy page** button above every page title copies the page as Markdown, opens it as Markdown
  in a new tab, or opens it in Claude.
- `llms.txt` and `llms-full.txt` cover the current docs only and list each page once with a short
  description; legacy guides and the API reference for `@warp-drive/legacy` and the
  `@ember-data/*` packages move to `llms-legacy.txt` and `llms-legacy-full.txt`. See
  [LLM Optimized Documentation](https://warp-drive.io/llm-docs).
- Legacy packages get real API landing pages, and legacy API pages and legacy-only guides carry a
  Legacy badge pointing to the modern replacement.
- API pages open with a type signature block and a one-line summary, guides and API pages link to
  each other throughout, and the `<Request />` component docs for `@warp-drive/ember` and
  `@warp-drive/react` list every arg and prop. The types behind them (such as `RequestSignature`
  and `RequestProps`) and the four request states (`PendingRequest`, `ResolvedRequest`,
  `RejectedRequest`, `CancelledRequest` from `@warp-drive/core/reactive`) are now exported.
- Mermaid diagrams render, including the ones in the relationship configuration guides.
