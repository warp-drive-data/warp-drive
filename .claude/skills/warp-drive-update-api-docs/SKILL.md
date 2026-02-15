---
name: warp-drive-update-api-docs
description: Updates and maintains API Docs for WarpDrive source code. Use when asked to add (or update) TSDoc, "add (or update) API docs, document code, add documentation comments, or when the user mentions TSDoc, TypeDoc, or API documentation for WarpDrive code.
---

# WarpDrive: Update API Documentation

You are a technical writer (use the expert-tech-writer skill), TypeDoc expert (use the typedoc-expert skill), and VitePress expert (use the vitepress-expert skill) responsible for updating and maintaining API documentation for WarpDrive.

## Purpose

Update and maintain API Docs for WarpDrive source code.

## Core API Documentation Principles

API Documentation is generated from [TSDoc](https://tsdoc.org/) comments in the source code
compiled with [TypeDoc](https://typedoc.org/) and transformed for [VitePress](https://vitepress.dev/) using [typedoc-plugin-markdown](https://www.typedoc-plugin-markdown.org/plugins/vitepress).

Always use the `/tech-writer-expert` and `/typedoc-expert` skills for specific questions about documentation best practices, TSDoc syntax, or TypeDoc configuration when updating API documentation.

### TsDoc + TypeDoc Syntax and Configuration

For TypeDoc syntax, configuration, and best practices, refer to the **/typedoc-expert** skill.

### Documenting Modules and Packages

There are two ways to document packages. Choose one:
- Use **index.md** for comprehensive landing page with examples and guides (preferred).
- Use **@module tag** for brief package description for packages that do not need a full landing page.

#### 1. Markdown Landing Pages (index.md Files) (preferred)

**Purpose:** Create rich landing pages for packages in the API documentation.

**How It Works:**
- Create `src/index.md` in the package directory
- Configure TypeDoc to use it via `readme: 'src/index.md'` in `typedoc.config.mjs`
- TypeDoc processes it as the package landing page
- Appears at `/api/{package-name}/` in the docs

In the adjacent `src/index.ts`, use `@mergeModuleWith` to link the markdown with the module:
```ts
/**
 * @module
 * @mergeModuleWith <project>
 */
```

**Format:**
- **Pure markdown** (NOT TSDoc syntax)
- Supports standard markdown + **TypeDoc and VitePress extensions** (code groups, callouts, etc.)
- **Use /typedoc-expert skill** for specific markdown syntax and features

**What to Include:**

See [index.md templates](./examples/index-md-templates.md) for complete examples for:
- Legacy packages
- Internal packages (not separately installable)
- Internal packages with legacy separate installation support

**Typical Structure:**
- Package title and status callout (if applicable)
- Brief description
- Overview section
- Installation instructions (appropriate for package type)
- Quick Start example
- Key Concepts
- Common Patterns
- API Overview with links
- Related Packages

**VitePress Features:**
- Use callouts (`::: tip`, `::: warning`, etc.) for important notes
- Use code groups for TypeScript/JavaScript examples
- Use `{@link}` syntax for internal cross-references
- See `/typedoc-expert` skill for complete markdown syntax reference

#### 2. TSDoc @module Tag (Code Comments)

**How It Works:**
- Configure TypeDoc to use `readme: 'none'` in `typedoc.config.mjs`
- Add a `@module` tag at the top of `src/index.ts` with a brief package description
- Appears at `/api/{package-name}/` in the docs alongside the exports.

Example `src/index.ts`:

```ts
/**
 * This package provides essential types and symbols used
 * by all the other WarpDrive packages.
 *
 * @module
 */
```

## Preview and Testing

From `docs-viewer/`:
```bash
pnpm start          # Build docs and start preview server
```

Use the chrome mcp (if available) to preview changes in the context of the full docs.

## Troubleshooting

If documentation isn't appearing in the preview:

1. **Check comment syntax:** Must use `/**` not `/*`
2. **Check for `@internal` tag:** Internal APIs are excluded
3. **Verify public export:** Symbol must be accessible via public API entrypoint
4. **Check line asterisks:** Every line must start with `*`
5. **Rebuild docs:** Run `pnpm typedoc` from `docs-viewer/` directory
