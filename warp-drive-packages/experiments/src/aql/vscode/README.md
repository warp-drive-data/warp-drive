# WarpDrive AQL Support (VS Code)

Syntax highlighting for [AQL](../README.md) — standalone `.aql` files, and `` aql`...` `` tagged
template literals embedded in `.js`/`.ts`/`.jsx`/`.tsx`/`.svelte` source.

This is an unpublished, standalone VS Code extension: it isn't part of the pnpm workspace (it has
its own packaging tool, `vsce`, rather than `tsdown`/`rollup`) and isn't published to the
Marketplace. Build and install it locally:

```sh
cd warp-drive-packages/experiments/src/aql/vscode
npx @vscode/vsce package --baseContentUrl none --baseImagesUrl none --skip-license -o aql.vsix
code --install-extension aql.vsix
```

## What's included

- `syntaxes/aql.tmLanguage.json` — highlights `.aql` files: the `QUERY <type> {}` wrapper, the
  `data`/`filter`/`page` sections, relationship vs. attribute field references, `@arg` variable
  declarations (including their optional type list), string/number/boolean/null literals, and `#`
  comments.
- `syntaxes/embedded-aql.tmLanguage.json` — injects the same highlighting into `` aql`...` `` /
  `` aqlFragment`...` `` tagged template literals in JS/TS/JSX/TSX/Svelte source.
- `language-configuration.json` — comment toggling (`Cmd+/` / `Ctrl+/`) and bracket
  matching/auto-closing for `{}`, `()`, and string quotes.
- `fileicons/aql-file-icon-theme.json` — a minimal file icon theme that gives `.aql` files a
  distinct icon (enable it via `Preferences: File Icon Theme` → "WarpDrive AQL Icons").
