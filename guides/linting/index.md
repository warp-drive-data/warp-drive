# Linting

Install the ESLint plugin `eslint-plugin-warp-drive`

::: code-group

```sh [pnpm]
pnpm add -E eslint-plugin-warp-drive@latest
```

```sh [npm]
npm add -E eslint-plugin-warp-drive@latest
```

```sh [yarn]
yarn add -E eslint-plugin-warp-drive@latest
```

```sh [bun]
bun add --exact eslint-plugin-warp-drive@latest
```

:::

## Rules

See the API docs for [eslint-plugin-warp-drive](/api/eslint-plugin-warp-drive/)

## Template Rules

Template rules operate on the Glimmer template AST rather than the JS/TS AST. They require
[`ember-eslint-parser`](https://github.com/NullVoxPopuli/ember-eslint-parser) (a dependency of
`eslint-plugin-warp-drive`) to be configured as the parser for the files being linted, since that's
what exposes template nodes to ESLint as `Glimmer`-prefixed selectors (e.g. `GlimmerElementNode`) for
`.gjs`/`.gts` files, or `ember-eslint-parser/hbs` for classic `.hbs` files. This mirrors the approach
[`eslint-plugin-ember`](https://github.com/ember-cli/eslint-plugin-ember) uses for its own
`template-*` rules, and the direction laid out in the
[First-Class Component Templates RFC](https://rfcs.emberjs.com/id/0779-first-class-component-templates/#linting-and-formatting)
for integrating template linting into ESLint.

## Usage

Recommended Rules are available as a flat config for easy consumption:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');

module.exports = [
  ...WarpDriveRecommended,
];
```
