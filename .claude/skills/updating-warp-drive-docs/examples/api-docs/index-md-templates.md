# index.md Templates for WarpDrive Packages

These templates provide starting points for creating `src/index.md` files in WarpDrive packages.

## Example 1: Modern Package

Use this template for actively maintained packages that users should install and use.

```markdown
# @warp-drive/package-name

Brief one-sentence description of what this package does.

## Overview

2-3 paragraphs explaining:
- The package's purpose and key features
- What problems it solves
- How it fits into the WarpDrive ecosystem

## Installation

\`\`\`bash
npm install @warp-drive/package-name
\`\`\`

Or with pnpm:

\`\`\`bash
pnpm add @warp-drive/package-name
\`\`\`

## Quick Start

\`\`\`ts
import { PrimaryAPI } from '@warp-drive/package-name';

// Minimal working example demonstrating core functionality
const instance = new PrimaryAPI();
instance.doSomething();
\`\`\`

## Key Concepts

### Concept 1

Brief explanation of an important concept.

### Concept 2

Brief explanation of another important concept.

## Common Patterns

### Basic Usage

\`\`\`ts
import { API } from '@warp-drive/package-name';

// Common use case with explanation
const result = API.method(params);
\`\`\`

### Advanced Usage

\`\`\`ts
import { API, AdvancedFeature } from '@warp-drive/package-name';

// More complex example showing advanced features
const config = {
  option1: true,
  option2: 'value'
};
const advanced = new AdvancedFeature(config);
\`\`\`

## API Overview

### Core APIs

- {@link PrimaryAPI} - Main API for core functionality
- {@link SecondaryAPI} - Additional functionality
- {@link ConfigOptions} - Configuration options

### Utilities

- {@link utilityFunction} - Helpful utility
- {@link helperFunction} - Another helper

See the full [API Reference](#) for complete details.

## Configuration

If applicable, document common configuration options:

\`\`\`ts
const config = {
  // Option description
  option1: true,
  // Another option
  option2: 'value'
};
\`\`\`

## Integration with Other Packages

Explain how this package works with other WarpDrive packages:

- Works seamlessly with {@link @warp-drive/core! | @warp-drive/core}
- Extends functionality of {@link @warp-drive/other! | @warp-drive/other}

## Examples

### Example 1: Common Use Case

\`\`\`ts
// Real-world example
\`\`\`

### Example 2: Another Use Case

\`\`\`ts
// Another real-world example
\`\`\`

## Tips and Best Practices

::: tip Performance
Tips for optimal performance
:::

::: warning Common Pitfalls
What to avoid when using this package
:::

## Related Packages

- {@link @warp-drive/related-package! | @warp-drive/related-package} - Description of relationship
- {@link @warp-drive/other-package! | @warp-drive/other-package} - Description of relationship

## Additional Resources

- [Guide: Getting Started](/guides/getting-started)
- [Guide: Advanced Usage](/guides/advanced-usage)
- [Migration Guide](/guides/migrations/migration-guide) (if applicable)
```

---

## Example 2: Legacy Package

Use this template for packages that exist only for backwards compatibility.

```markdown
# @warp-drive/legacy-package

:::warning ⚠️ Legacy Package

**This package only exists for backwards compatibility.**

This package has been superseded by {@link @warp-drive/modern-package! | @warp-drive/modern-package}.
New projects should use the modern package instead. This package will be removed in a future major version.

See the [migration guide](#migration-path) for upgrade instructions.
:::

Brief description of what this legacy package does.

## Overview

Explanation of the package's original purpose and why it's now legacy.

## Migration Guide

For new projects, use {@link @warp-drive/modern-package! | @warp-drive/modern-package} instead:

\`\`\`ts
// Old (legacy)
import { OldAPI } from '@warp-drive/legacy-package';

// New (recommended)
import { NewAPI } from '@warp-drive/modern-package';
\`\`\`

(For more complicated migrations) See the [migration guide](/guides/migrations/legacy-to-modern) for complete migration instructions.

## Legacy API Reference

Links to the legacy API documentation for existing users.

## Related Packages

- {@link @warp-drive/modern-package! | @warp-drive/modern-package} - The modern replacement
```

---

## Example 3: Internal Package (Not Separately Installable)

Use this template for internal packages that are only installed as dependencies of other packages.

```markdown
# @warp-drive/internal-package

:::warning ⚠️ Internal Package

This package is automatically installed as a dependency of {@link @warp-drive/core! | @warp-drive/core}.
You should not install it separately. Install the main package instead.
:::

Brief description of what this package provides to other WarpDrive packages.

## Overview

2-3 paragraphs explaining:
- The package's purpose within the WarpDrive ecosystem
- Why it's internal (implementation detail, shared utilities, etc.)
- Which packages use it

## Usage

This package is used internally by WarpDrive. Import from the main package:

\`\`\`ts
// ❌ Don't import from the internal package directly
import { InternalAPI } from '@warp-drive/internal-package';

// ✅ Import from the main package instead
import { PublicAPI } from '@warp-drive/core';
\`\`\`

## Key Concepts

Brief explanations of core concepts if relevant for understanding the architecture.

## API Overview

High-level overview of the internal APIs, noting that they may change between minor versions.

## Related Packages

- {@link @warp-drive/core! | @warp-drive/core} - Main package that uses this internally
- {@link @warp-drive/other! | @warp-drive/other} - Other packages that depend on this
```

---

## Example 4: Internal Package (Legacy Separate Installation Still Supported)

Use this template for packages that were previously installed separately but are now internal, still supporting legacy separate installation for backwards compatibility.

```markdown
# @warp-drive/transitional-package

:::warning ⚠️ Installation Note

**For new projects:** This package is automatically included with {@link @warp-drive/core! | @warp-drive/core}. You don't need to install it separately.

**For existing projects:** Separate installation is still supported for backwards compatibility, but is no longer recommended.
:::

Brief description of what this package does.

## Overview

2-3 paragraphs explaining:
- The package's purpose
- Why it was transitioned to internal
- Migration path for existing users

## Installation

### New Projects (Recommended)

See {@link @warp-drive/core! | @warp-drive/core} for installation instructions. This package is included as a dependency.

### Existing Projects (Legacy Support)

If you're already using this package separately, it will continue to work:

\`\`\`bash
npm install @warp-drive/transitional-package
\`\`\`

However, we recommend migrating to the main package when convenient.

## Migration Guide

To migrate from separate installation to the bundled version:

1. Remove the separate package from `package.json`
2. Update imports to use `@warp-drive/core`
3. No code changes needed - the API is identical

\`\`\`ts
// Before
import { API } from '@warp-drive/transitional-package';

// After
import { API } from '@warp-drive/core';
\`\`\`

## Key Concepts

Brief explanations of core concepts.

## Common Patterns

### Pattern 1

\`\`\`ts
// Example code showing usage
\`\`\`

## API Overview

High-level overview of main APIs with links to detailed docs.

## Related Packages

- {@link @warp-drive/core! | @warp-drive/core} - Main package (recommended for new projects)
```

---

## VitePress Features Reference

All templates above support VitePress and TypeDoc markdown extensions.

See [vitepress.md](../../references/vitepress.md) for a reference of VitePress features and markdown extensions that can be used in these templates.
See [typedoc.md](../../references/typedoc.md) for TypeDoc Markdown features that can be used in these templates (especially `{@link}` as shown below).

### Links

```markdown
<!-- Internal API link -->
{@link @warp-drive/package! | @warp-drive/package}

<!-- Internal guide link -->
[Migration Guide](/guides/migrations/guide-name)

<!-- External link -->
[TypeDoc](https://typedoc.org/)
```
