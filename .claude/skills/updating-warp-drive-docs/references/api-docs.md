# API Documentation Patterns

Comprehensive guidance for creating and maintaining API documentation in WarpDrive.

## Table of Contents

- [Overview](#overview)
- [When to Document APIs](#when-to-document-apis)
- [Core Principles](#core-principles)
- [Documentation Approaches](#documentation-approaches)
  - [Markdown Landing Pages (index.md)](#markdown-landing-pages-indexmd)
  - [TSDoc for Code Structures](#tsdoc-for-code-structures)
- [Landing Page Patterns](#landing-page-patterns)
  - [Modern Packages](#modern-packages)
  - [Legacy Packages](#legacy-packages)
  - [Internal Packages](#internal-packages)
  - [Transitional Packages](#transitional-packages)
- [Integration with TypeDoc](#integration-with-typedog)
- [Preview and Testing](#preview-and-testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related References](#related-references)

## Overview

API documentation in WarpDrive is generated from TSDoc comments in source code, compiled with TypeDoc, and transformed for VitePress using typedoc-plugin-markdown. This creates a seamless integration between code and documentation.

## When to Document APIs

Document APIs when:

- **Creating public packages** - All public packages require API documentation
- **Exposing public exports** - Any function, class, interface, or type exported from a package
- **Documenting modules** - Package-level documentation providing context and usage patterns
- **Adding complex functionality** - Advanced features benefit from detailed explanations
- **Supporting legacy code** - Maintain documentation for backwards compatibility

Skip documentation for the following unless they are explicitly requested to be documented:

- **Internal implementations** - ALWAYS mark with `@internal` tag to exclude from public docs
- **Private members** - TypeDoc excludes private class members automatically
- **Self-explanatory code** - Simple getters/setters with obvious purpose

## Core Principles

API documentation generation follows this flow:

1. **TSDoc comments** in source code define the content
2. **TypeDoc** compiles the comments into structured documentation
3. **typedoc-plugin-markdown** transforms TypeDoc output for VitePress
4. **VitePress** renders the final documentation site

Key principles:

- Write TSDoc comments for all public APIs
- Use markdown landing pages (index.md) for rich package documentation
- Reference [typedoc.md](./typedoc.md) for comprehensive TSDoc syntax and TypeDoc configuration
- Use imperative/infinitive writing style (no second person)
- Provide practical examples demonstrating real-world usage

## Documentation Approaches

Choose the appropriate documentation approach based on package needs.

### Markdown Landing Pages (index.md)

**Recommended approach** for packages requiring comprehensive documentation with examples, guides, and context.

#### How It Works

1. Create `src/index.md` in the package directory
2. Configure TypeDoc in `typedoc.config.mjs`:
   ```js
   export default {
     readme: 'src/index.md',
     // ... other config
   };
   ```
3. In adjacent `src/index.ts`, link the markdown to the module:
   ```ts
   /**
    * @module
    * @mergeModuleWith <project>
    */
   ```
4. TypeDoc processes the markdown as the package landing page
5. Documentation appears at `/api/{package-name}/` in the docs site

#### Format and Features

- Write in **pure markdown** (not TSDoc syntax)
- Support for standard markdown plus TypeDoc and VitePress extensions
- Use VitePress callouts (`::: tip`, `::: warning`, etc.) for important notes
- Use code groups for TypeScript/JavaScript examples
- Use `{@link}` syntax for internal cross-references

See [typedoc.md](./typedoc.md) and [vitepress.md](./vitepress.md) for complete markdown syntax and features.

#### Content Guidelines

Structure landing pages to provide:

- Package title with status callout (if applicable)
- Brief description of purpose
- Overview section explaining key features
- Installation instructions (appropriate for package type)
- Quick Start example demonstrating core functionality
- Key Concepts explaining important ideas
- Common Patterns showing typical usage
- API Overview with links to detailed documentation
- Related Packages connecting to the broader ecosystem

See [examples/api-docs/](../examples/api-docs/index-md-templates.md) for complete landing page templates.

### TSDoc for Code Structures

TSDoc provides specialized syntax for different code structures. See [typedoc.md](./typedoc.md) for comprehensive details on:

- **Functions and methods** - Parameter descriptions, return values, examples
- **Classes and interfaces** - Constructor documentation, member descriptions
- **Type aliases and enums** - Value explanations, usage context
- **Generics** - Type parameter documentation
- **Special tags** - `@deprecated`, `@internal`, `@example`, etc.

#### Quick Reference

Common TSDoc patterns:

```ts
/**
 * Brief description of function purpose.
 *
 * Detailed explanation providing context and usage guidance.
 *
 * @param name - Description of parameter
 * @param options - Configuration object
 * @returns Description of return value
 * @example
 * ```ts
 * const result = myFunction('value', { option: true });
 * ```
 */
export function myFunction(name: string, options: Options): Result {
  // implementation
}
```

For complete TSDoc syntax, configuration, and advanced patterns, consult [typedoc.md](./typedoc.md).

## Landing Page Patterns

Four common patterns exist for index.md landing pages, each suited to different package types.

### Modern Packages

Use for actively maintained packages that users should install and use.

**Key sections:**
- Installation instructions with npm/pnpm commands
- Quick Start demonstrating core functionality
- Key Concepts explaining important ideas
- Common Patterns showing typical and advanced usage
- API Overview linking to detailed documentation
- Integration with other packages
- Tips and Best Practices with callouts
- Related Packages connecting the ecosystem

See [examples/api-docs/index-md-templates.md#example-1-modern-package](../examples/api-docs/index-md-templates.md#example-1-modern-package) for complete template.

### Legacy Packages

Use for packages maintained only for backwards compatibility.

**Key features:**
- Warning callout at the top alerting users to legacy status
- Clear migration path to modern replacement
- Minimal documentation focused on existing users
- Links to migration guides
- Deprecation timeline (if applicable)

**Example callout:**
```markdown
:::warning ⚠️ Legacy Package

**This package only exists for backwards compatibility.**

This package has been superseded by {@link @warp-drive/modern-package! | @warp-drive/modern-package}.
New projects should use the modern package instead. This package will be removed in a future major version.

See the [migration guide](#migration-path) for upgrade instructions.
:::
```

See [examples/api-docs/index-md-templates.md#example-2-legacy-package](../examples/api-docs/index-md-templates.md#example-2-legacy-package) for complete template.

### Internal Packages

Use for internal packages installed only as dependencies of other packages.

**Key features:**
- Warning callout explaining automatic installation
- Guidance to install main package instead
- Explanation of role within WarpDrive ecosystem
- Architecture documentation if relevant
- Note that APIs may change between minor versions

**Example callout:**
```markdown
:::warning ⚠️ Internal Package

This package is automatically installed as a dependency of {@link @warp-drive/core! | @warp-drive/core}.
You should not install it separately. Install the main package instead.
:::
```

See [examples/api-docs/index-md-templates.md#example-3-internal-package-not-separately-installable](../examples/api-docs/index-md-templates.md#example-3-internal-package-not-separately-installable) for complete template.

### Transitional Packages

Use for packages that were previously installed separately but are now internal, still supporting legacy separate installation.

**Key features:**
- Installation Note callout explaining new vs. existing installation
- Separate installation sections for new and existing projects
- Migration guide from separate to bundled version
- Emphasis on recommended approach
- Reassurance that legacy support continues to work

**Example callout:**
```markdown
:::warning ⚠️ Installation Note

**For new projects:** This package is automatically included with {@link @warp-drive/core! | @warp-drive/core}. You don't need to install it separately.

**For existing projects:** Separate installation is still supported for backwards compatibility, but is no longer recommended.
:::
```

See [examples/api-docs/index-md-templates.md#example-4-internal-package-legacy-separate-installation-still-supported](../examples/api-docs/index-md-templates.md#example-4-internal-package-legacy-separate-installation-still-supported) for complete template.

## Integration with TypeDoc

TypeDoc configuration lives in each package's `typedoc.config.mjs` file.

### Key Configuration Options

```js
export default {
  // Use markdown landing page
  readme: 'src/index.md',

  // Or use none for @module tag
  // readme: 'none',

  // Entry point for TypeDoc analysis
  entryPoints: ['src/index.ts'],

  // Output directory
  out: '../../docs-viewer/src/api/package-name',

  // Other standard options
  // See typedoc.md for complete configuration reference
};
```

### Common Patterns

**For packages with rich landing pages:**
```js
export default {
  readme: 'src/index.md',
  entryPoints: ['src/index.ts'],
  // ...
};
```

**For minimal packages:**
```js
export default {
  readme: 'none',
  entryPoints: ['src/index.ts'],
  // ...
};
```

See [typedoc.md](./typedoc.md) for comprehensive TypeDoc configuration guidance.

## Preview and Testing

Preview documentation changes before committing:

```bash
cd docs-viewer/
pnpm start          # Build docs and start preview server
```

This command:
1. Runs TypeDoc on all packages
2. Processes markdown and TSDoc comments
3. Starts a local VitePress development server
4. Opens preview in browser

Use the chrome-devtools MCP (if available) to preview changes in the context of the full documentation site.

## Best Practices

### Writing Style

Follow guidelines from [tech-writing.md](./tech-writing.md).

### Code Examples

- Demonstrate real-world usage patterns
- Include complete, runnable examples
- Show both basic and advanced usage
- Use TypeScript with proper typing
- Add comments explaining non-obvious parts

### Cross-References

- Link to related APIs using `{@link}`
- Connect to relevant guides and tutorials
- Reference related packages in the ecosystem
- Point to migration guides for legacy packages

### Callouts

Use VitePress callouts strategically:

- `::: tip` - Performance optimizations, helpful shortcuts
- `::: info` - Additional context, related information
- `::: warning` - Important limitations, deprecated features
- `::: danger` - Breaking changes, critical issues

### Maintenance

- Update documentation when APIs change
- Keep examples current with latest patterns
- Review and update migration guides
- Mark deprecated features with `@deprecated` tag
- Remove documentation for deleted features

## Troubleshooting

If documentation doesn't appear in the preview:

1. **Check comment syntax** - Must use `/**` not `/*`
2. **Verify public export** - Symbol must be accessible via public API entrypoint
3. **Check for @internal tag** - Internal APIs are excluded from public docs
4. **Check line asterisks** - Every line in TSDoc comment must start with `*`
5. **Rebuild docs** - Run `pnpm start` from `docs-viewer/` directory
6. **Check TypeDoc config** - Verify `typedoc.config.mjs` settings
7. **Review console output** - TypeDoc reports warnings and errors during build

Common issues:

- **Missing documentation** - Likely not exported or marked `@internal`
- **Broken links** - Check `{@link}` syntax and target exists
- **Formatting problems** - Verify markdown syntax in index.md
- **Build errors** - Review TypeDoc configuration and TSDoc comment syntax

## Related References

- [typedoc.md](./typedoc.md) - Comprehensive TypeDoc and TSDoc reference
- [vitepress.md](./vitepress.md) - VitePress features and markdown extensions
- [tech-writing.md](./tech-writing.md) - Writing style and documentation best practices
- [examples/api-docs/](../examples/api-docs/) - API Docs examples

For specific questions:

- **TSDoc syntax and tags** - See [typedoc.md](./typedoc.md)
- **TypeDoc configuration** - See [typedoc.md](./typedoc.md)
- **Markdown features** - See [typedoc.md](./typedoc.md) VitePress section
- **Writing style** - See [tech-writing.md](./tech-writing.md)
- **Landing page structure** - See [examples/api-docs/](../examples/api-docs/) templates
