---
releases: ["5.9"]
---
`eslint-plugin-warp-drive` gains its first template rule, `template-always-use-request-content`,
which flags a `<Request>` whose result is never used: no `:content` block or other named block,
or a `:content` block that doesn't capture or reference the yielded result. That usually means
the data is being read some other way, such as from the store, bypassing the boundary `<Request>`
sets up. A new `eslint-plugin-warp-drive/recommended-templates` config wires up
`ember-eslint-parser` for `.gjs`/`.gts` files and enables the rule. The `no-legacy-imports`
autofix also now preserves type-only imports, and reports (without fixing) legacy imports it
can't map safely instead of skipping them. See [Linting](/guides/linting/index.md).
