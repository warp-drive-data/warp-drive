---
name: updating-warp-drive-docs
description: This skill should be used when the user asks to "update docs", "write documentation", "add TSDoc", "create guide", "update README", "document code", "improve documentation", "write API docs", "document the API", "add documentation comments", "help with VitePress", "configure VitePress", or mentions TypeDoc, TSDoc, technical writing, guides, or READMEs for WarpDrive. Comprehensive documentation expertise for all WarpDrive documentation types including API docs, guides, READMEs, and VitePress site configuration.
---

# WarpDrive Documentation

Comprehensive documentation expertise for all WarpDrive documentation types.

## Overview

This skill provides guidance for all WarpDrive documentation tasks, covering API documentation, guides, READMEs, technical writing, TypeDoc, and VitePress. This skill serves as the single entry point for any documentation work.

## Documentation Architecture

WarpDrive uses three distinct documentation systems:

### 1. API Documentation (TSDoc + TypeDoc + VitePress)

**Location:** Inline `/** */` comments in source code
**Build Process:** TypeDoc → Markdown → VitePress
**Output:** [docs.warp-drive.io/api/](https://docs.warp-drive.io/api/)

**Purpose:**
- Reference documentation for classes, functions, types
- Generated from TypeScript source code
- Includes type signatures and parameter descriptions
- Auto-discovered via package entrypoints

**When to use:**
- Documenting functions, classes, types
- Adding code-level documentation
- Describing parameters and return values
- Marking internal vs public APIs

**References:**
- **[references/api-docs.md](references/api-docs.md)** - API documentation patterns and when to use them
- **[references/typedoc.md](references/typedoc.md)** - Complete TypeDoc and TSDoc reference

**Examples:**
- **[examples/typedoc/well-documented-class.ts](examples/typedoc/well-documented-class.ts)** - Well-documented TypeScript class

### 2. Guide Documentation (VitePress)

**Location:** `guides/` directory markdown files
**Build Process:** VitePress static site
**Output:** [docs.warp-drive.io/guides/](https://docs.warp-drive.io/guides/)

**Purpose:**
- Tutorials and how-to guides
- Conceptual explanations
- Migration guides
- Long-form educational content

**When to use:**
- Writing tutorials or walkthroughs
- Explaining concepts and architecture
- Creating getting-started guides
- Documenting migration paths

**References:**
- **[references/guides.md](references/guides.md)** - Guide documentation patterns for all guide types

**Examples:**
- **[examples/guides/good-tutorial.md](examples/guides/good-tutorial.md)** - Tutorial guide pattern
- **[examples/guides/good-concept.md](examples/guides/good-concept.md)** - Concept guide pattern
- **[examples/guides/migration-guide.md](examples/guides/migration-guide.md)** - Migration guide pattern
- **[examples/guides/api-reference-guide.md](examples/guides/api-reference-guide.md)** - API reference guide pattern
- **[examples/guides/effective-guide-pattern.md](examples/guides/effective-guide-pattern.md)** - Guide structure template

### 3. README Documentation (GitHub Markdown)

**Location:** Package and project root `README.md` files
**Build Process:** Direct GitHub rendering
**Output:** GitHub repository and npm package pages

**Purpose:**
- Optimized for viewing on GitHub and npm registry
- Package quick-start and overview
- Installation instructions
- Project structure and setup
- Links to full documentation

**When to use:**
- Creating package READMEs
- Updating project README
- Adding quick-start examples
- Installation and setup instructions

**References:**
- **[references/readmes.md](references/readmes.md)** - README documentation patterns for packages and projects

**Examples:**
- **[examples/readmes/package-readme-pattern.md](examples/readmes/package-readme-pattern.md)** - Package README structure
- **[examples/readmes/package-readme.md](examples/readmes/package-readme.md)** - Complete package README example
- **[examples/readmes/github-markdown.md](examples/readmes/github-markdown.md)** - GitHub markdown reference

## Quick Workflows

### Adding TSDoc to Code

1. Read [references/api-docs.md](references/api-docs.md) for API documentation patterns
2. Read [references/typedoc.md](references/typedoc.md) for comprehensive TSDoc syntax
3. Add `/** */` comments above code with appropriate tags
4. Use `@since` for public APIs, `@internal` for private
5. Preview: `cd docs-viewer && pnpm start`

### Creating a New Guide

1. Read [references/guides.md](references/guides.md) for guide patterns
2. Determine guide type (tutorial, concept, migration, or API reference)
3. Review relevant example in [examples/guides/](examples/guides/)
4. Create markdown file in appropriate `guides/` subdirectory
5. Add YAML frontmatter with required fields
6. Preview: `cd docs-viewer && pnpm start`

### Updating a README

1. Read [references/readmes.md](references/readmes.md) for README patterns
2. Review examples in [examples/readmes/](examples/readmes/)
3. Update relevant README.md file
4. Preview on GitHub or locally

### VitePress Configuration

1. Read [references/vitepress.md](references/vitepress.md) for VitePress features
2. Configuration files: `docs-viewer/.vitepress/config.ts`
3. Reference plugin documentation in vitepress.md
4. Test: `cd docs-viewer && pnpm start`

### Technical Writing Review

1. Read [references/tech-writing.md](references/tech-writing.md) for writing principles
2. Check for clarity, scannability, and audience optimization
3. Verify documentation works for humans, LLMs, and SEO

## Decision Tree

Choose the right documentation type:

```
Is this about code (functions, classes, types)?
├─ Yes → Read references/api-docs.md and references/typedoc.md
│         Write TSDoc comments in source files
└─ No → Is this a tutorial, concept, or guide?
    ├─ Yes → Read references/guides.md
    │         Create/update guides/ markdown files
    └─ No → Is this a package overview or quick-start?
        ├─ Yes → Read references/readmes.md
        │         Update README.md files
        └─ No → Is this about VitePress configuration?
            ├─ Yes → Read references/vitepress.md
            │         Update VitePress config
            └─ No → Is this about writing quality?
                └─ Yes → Read references/tech-writing.md
                          Apply writing principles
```

## Cross-Documentation Strategy

Many documentation updates involve multiple types. For example:

**New Feature:**
1. Add TSDoc comments (API docs)
2. Create tutorial guide (guides)
3. Add quick mention to README

**Breaking Change:**
1. Update affected TSDoc (API docs)
2. Create migration guide (guides)
3. Update README examples

**Bug Fix:**
1. Update TSDoc if behavior changed (API docs)
2. Maybe update guide if usage changed

Coordinate updates across all relevant documentation types for consistency.

## Reference Files

All detailed documentation expertise is in reference files:

- **[references/tech-writing.md](references/tech-writing.md)** - Technical writing principles and best practices
- **[references/typedoc.md](references/typedoc.md)** - Complete TypeDoc and TSDoc reference (~1,000 lines)
- **[references/vitepress.md](references/vitepress.md)** - Complete VitePress reference (~1,000 lines)
- **[references/api-docs.md](references/api-docs.md)** - API documentation patterns
- **[references/guides.md](references/guides.md)** - Guide documentation patterns
- **[references/readmes.md](references/readmes.md)** - README documentation patterns

## Examples Directory

Working examples organized by type:

- **[examples/api-docs/](examples/api-docs/)** - API documentation templates
- **[examples/guides/](examples/guides/)** - Guide examples (5 patterns)
- **[examples/readmes/](examples/readmes/)** - README examples and templates
- **[examples/typedoc/](examples/typedoc/)** - TypeDoc code examples
- **[examples/vitepress/](examples/vitepress/)** - VitePress markdown features

## Quick Reference Card

**"I need to..."**

| Task | Reference | Examples |
|------|-----------|----------|
| Document a function/class | [api-docs.md](references/api-docs.md), [typedoc.md](references/typedoc.md) | [well-documented-class.ts](examples/typedoc/well-documented-class.ts) |
| Write a tutorial | [guides.md](references/guides.md) | [good-tutorial.md](examples/guides/good-tutorial.md) |
| Add quick-start | [readmes.md](references/readmes.md) | [package-readme-pattern.md](examples/readmes/package-readme-pattern.md) |
| Create migration guide | [guides.md](references/guides.md) | [migration-guide.md](examples/guides/migration-guide.md) |
| Update package overview | [readmes.md](references/readmes.md) | [package-readme.md](examples/readmes/package-readme.md) |
| Explain a concept | [guides.md](references/guides.md) | [good-concept.md](examples/guides/good-concept.md) |
| Configure VitePress | [vitepress.md](references/vitepress.md) | [markdown-features.md](examples/vitepress/markdown-features.md) |
| Improve writing quality | [tech-writing.md](references/tech-writing.md) | - |

**Essential Tags for TSDoc:**
- `@since` - Version (REQUIRED for public APIs)
- `@internal` - Exclude from docs (REQUIRED for private)
- `@param` - Parameter description
- `@return` - Return value description
- `@hideconstructor` - Hide constructor from docs

**Development Commands:**
```bash
# Start dev server with live reload
cd docs-viewer
pnpm start

# Build for production
cd docs-viewer
pnpm build
```

**Remember:**
- Always read relevant reference files for detailed guidance
- Check examples for working templates
- Preview documentation changes before committing
- Apply writing principles from tech-writing.md
- Coordinate updates across multiple documentation types when needed
