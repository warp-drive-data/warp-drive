# eslint-plugin-warp-drive

Lint rules for helping to ensure best practices and hygiene when using ***Warp*Drive**.

:::tip 💡 Backwards Compatibility
For security and backwards compatibility, this Package is also available as `eslint-plugin-ember-data`
:::

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
| {@link eslint-plugin-warp-drive!rules/no-create-record-rerender | no-create-record-rerender} | Helps avoid patterns that often lead to excess or broken renders | 🐞⚡️ | ✅ |
| {@link eslint-plugin-warp-drive!rules/no-invalid-relationships | no-invalid-relationships} | Ensures the basic part of relationship configuration is setup appropriately | 🏆 | ✅ |
| {@link eslint-plugin-warp-drive!rules/no-legacy-request-patterns | no-legacy-request-patterns} | Restricts usage of deprecated or discouraged request patterns | 🏆 | ✅ |
| {@link eslint-plugin-warp-drive!rules/no-external-request-patterns | no-external-request-patterns} | Restricts usage of discouraged non-warp-drive request patterns | 🏆 | ✅ |
| {@link eslint-plugin-warp-drive!rules/no-invalid-resource-types | no-invalid-resource-types} | Ensures resource types follow a conventional pattern when used in common APIs | 🏆 | ✅🛠️ |
| {@link eslint-plugin-warp-drive!rules/no-invalid-resource-ids | no-invalid-resource-ids} | Ensures resource ids are strings when used in common APIs | 🏆 | ✅🛠️ |
| {@link eslint-plugin-warp-drive!rules/no-legacy-imports | no-legacy-imports} | Ensures imports use paths specified by the Package Unification RFC | 🏆 | ✅🛠️ |
| {@link eslint-plugin-warp-drive!rules/no-test-module-hooks | no-test-module-hooks} | Disallow `hooks.beforeEach`/`hooks.afterEach` in favor of setup functions each test calls explicitly | ⚡️ | |
| {@link eslint-plugin-warp-drive!rules/template-always-use-request-content | template-always-use-request-content} | Ensures the result of a `<Request>` is actually consumed | 🐞 | |
| {@link eslint-plugin-warp-drive!rules/template-require-request-error-block | template-require-request-error-block} | Ensures `<Request>`/`<Await>` always provide an `:error` block | 🐞 | |
| {@link eslint-plugin-warp-drive!rules/require-request-error-block | require-request-error-block} | Ensures `<Request>` is always given a `states.error` handler | 🐞 | |

## Usage

Recommended Rules are available as a flat config for easy consumption:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');

module.exports = [
  ...WarpDriveRecommended,
];
```

The template rules, `template-always-use-request-content` and
`template-require-request-error-block`, are available as a separate flat config, since it also
sets `ember-eslint-parser` as the parser for `.gjs`/`.gts` files:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');
const WarpDriveTemplateRecommended = require('eslint-plugin-warp-drive/recommended-templates');

module.exports = [
  ...WarpDriveRecommended,
  ...WarpDriveTemplateRecommended,
];
```

The React rule, `require-request-error-block`, is available as a separate flat config, since it
also enables JSX parsing for `.jsx`/`.tsx` files:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');
const WarpDriveReactRecommended = require('eslint-plugin-warp-drive/recommended-react');

module.exports = [
  ...WarpDriveRecommended,
  ...WarpDriveReactRecommended,
];
```

The internal rule, `no-test-module-hooks`, encodes conventions for a large test suite like
***Warp*Drive**'s own rather than for app code, so it is kept out of `recommended` and is
available as its own flat config:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');
const WarpDriveInternalRecommended = require('eslint-plugin-warp-drive/recommended-internal');

module.exports = [
  ...WarpDriveRecommended,
  ...WarpDriveInternalRecommended,
];
```

## Guides

- [Linting](/guides/linting/): install the plugin and enable its recommended, template and React
  configs.

