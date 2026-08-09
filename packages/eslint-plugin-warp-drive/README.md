<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/ember-data/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/ember-data.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS
)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S
)

<p align="center">
  <br>
  <a href="https://warp-drive.io">WarpDrive</a> is the lightweight data library for web apps &mdash;
  <br>
  universal, typed, reactive, and ready to scale.
  <br/><br/>
</p>

---

# eslint-plugin-warp-drive

Lint rules for helping to ensure best practices and hygiene when using ***Warp*Drive**.

> [!TIP]
> This Package is also available as eslint-plugin-ember-data

## Rules

- 🛠️ has Autofix
- 〽️ has Partial Autofix
- ✅ Recommended
- 💜 TypeScript Aware

**🏷️ Categories**

- 🐞 Helps prevent buggy code
- ⚡️ Helps prevent performance issues
- 🏆 Enforces a best practice

| Rule | Description | 🏷️ | ✨ |
| ---- | ----------- | -- | -- |
| [no-create-record-rerender](./docs/no-create-record-rerender.md) | Helps avoid patterns that often lead to excess or broken renders | 🐞⚡️ | ✅ |
| [no-invalid-relationships](./docs/no-invalid-relationships.md) | Ensures the basic part of relationship configuration is setup appropriately | 🏆 | ✅ |
| [no-legacy-request-patterns](./docs/no-legacy-request-patterns.md) | Restricts usage of deprecated or discouraged request patterns | 🏆 | ✅ |
| [no-external-request-patterns](./docs/no-external-request-patterns.md) | Restricts usage of discouraged non-warp-drive request patterns | 🏆 | ✅ |
| [no-invalid-resource-types](./docs/no-invalid-resource-types.md) | Ensures resource types follow a conventional pattern when used in common APIs | 🏆 | ✅🛠️ |
| [no-invalid-resource-ids](./docs/no-invalid-resource-ids.md) | Ensures resource ids are strings when used in common APIs | 🏆 | ✅🛠️ |
| [no-legacy-imports](./docs/no-legacy-imports.md) | Ensures imports use paths specified by the Package Unification RFC | 🏆 | ✅🛠️ |

## Template Rules

Template rules operate on the Glimmer template AST rather than the JS/TS AST. They require
[`ember-eslint-parser`](https://github.com/NullVoxPopuli/ember-eslint-parser) (a dependency of this
package) to be configured as the parser for the files being linted, since that's what exposes
template nodes to ESLint as `Glimmer`-prefixed selectors (e.g. `GlimmerElementNode`) for `.gjs`/`.gts`
files, or `ember-eslint-parser/hbs` for classic `.hbs` files. This mirrors the approach
[`eslint-plugin-ember`](https://github.com/ember-cli/eslint-plugin-ember) uses for its own
`template-*` rules, and the direction laid out in the
[First-Class Component Templates RFC](https://rfcs.emberjs.com/id/0779-first-class-component-templates/#linting-and-formatting)
for integrating template linting into ESLint.

| Rule | Description | 🏷️ | ✨ |
| ---- | ----------- | -- | -- |
| [template-always-use-request-content](./docs/template-always-use-request-content.md) | Ensures the result of a `<Request>` is actually consumed | 🐞 | |

## Usage

Recommended Rules are available as a flat config for easy consumption:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');

module.exports = [
  ...WarpDriveRecommended,
];
```

Template rules are available as a separate flat config, since they additionally wire up
`ember-eslint-parser` for `.gjs`/`.gts` files:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');
const WarpDriveTemplateRecommended = require('eslint-plugin-warp-drive/recommended-templates');

module.exports = [
  ...WarpDriveRecommended,
  ...WarpDriveTemplateRecommended,
];
```

To lint classic `.hbs` files instead of (or in addition to) `.gjs`/`.gts`, add your own override
using [`ember-eslint-parser/hbs`](https://github.com/NullVoxPopuli/ember-eslint-parser#hbs-handlebars-support)
as the parser for `**/*.hbs`.
