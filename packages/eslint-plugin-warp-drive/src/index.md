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

## Usage

Recommended Rules are available as a flat config for easy consumption:

```ts
// eslint.config.js (flat config)
const WarpDriveRecommended = require('eslint-plugin-warp-drive/recommended');

module.exports = [
  ...WarpDriveRecommended,
];
```

