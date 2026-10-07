---
releases: ["5.10"]
---
`eslint-plugin-warp-drive` adds two rules that flag a `<Request>` or `<Await>` with no error
handling, so a rejected request always has UI to render instead of surfacing as an uncaught error:

- `template-require-request-error-block` requires an `:error` block on Ember's `<Request>` and
  `<Await>`. It is on as an error in `eslint-plugin-warp-drive/recommended-templates`, so apps
  using that config may see new lint failures until each usage gets an `:error` block.
- `require-request-error-block` requires a `states.error` handler on `@warp-drive/react`'s
  `<Request>`. It ships in a new `eslint-plugin-warp-drive/recommended-react` config, which also
  turns on JSX parsing for `.jsx`/`.tsx` files.

See [Linting](/guides/linting/index.md).
