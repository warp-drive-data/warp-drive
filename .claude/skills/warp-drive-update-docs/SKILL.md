---
name: warp-drive-update-docs
description: Orchestration skill for determining which documentation skill to use. Use when the user asks to "update docs", "improve documentation", "document this", "add documentation", "help with docs", or makes general requests about documentation without specifying the type.
---

# WarpDrive Documentation Overview

## Purpose

Provide guidance for all WarpDrive documentation types and help determine which specific documentation skill to use. This skill serves as an entry point for general documentation requests.

## WarpDrive Documentation Architecture

WarpDrive uses three distinct documentation systems, each with specific purposes and audiences:

### 1. API Documentation (TSDoc+TypeDoc+VitePress)

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

**Use the `warp-drive-update-api-docs` skill for:**
- "Add TSDoc comments"
- "Document this function"
- "Write API documentation"
- "Add documentation to this class"

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

**Use the `warp-drive-update-guides` skill for:**
- "Write a guide"
- "Create tutorial"
- "Add migration guide"
- "Explain this concept in the docs"

### 3. README Documentation (GitHub Markdown)

**Location:** Package and project root `README.md` files
**Build Process:** Direct GitHub rendering
**Output:** GitHub repository and npm package pages

**Purpose:**
- Optimized for viewing on GitHub and the npm registry
- Package quick-start and overview
- Installation instructions
- Project structure and setup for local development
- Links to full documentation

**When to use:**
- Creating package READMEs
- Updating project README
- Adding quick-start examples
- Installation and setup instructions

**Use the `warp-drive-update-readmes` skill for:**
- "Update the README"
- "Write package README"
- "Add installation instructions"
- "Document quick-start usage"

## Choosing the Right Documentation Type

Use this decision tree:

```
Is this about code (functions, classes, types)?
├─ Yes → Use warp-drive-update-api-docs
│         Write TSDoc comments in source files
└─ No → Is this a tutorial, concept, or guide?
    ├─ Yes → Use warp-drive-update-guides
    │         Create/update guides/ markdown files
    └─ No → Is this a package overview or quick-start?
        ├─ Yes → Use warp-drive-update-readmes
        │         Update README.md files
        └─ Unclear → Continue with this skill
                      Gather more context
```

For all documentation types, use the `tech-writer-expert` skill for best practices on clarity, structure, and audience optimization. Note that per the "Cross-Documentation Strategy" section in the `tech-writer-expert` skill, many documentation updates will involve multiple types (e.g. API docs + guides + README). In those cases, coordinate updates across all relevant documentation types for consistency and completeness.

## Quick Reference

**"I need to..."**

- **Document a function/class** → `warp-drive-update-api-docs`
- **Write a tutorial** → `warp-drive-update-guides`
- **Add quick-start** → `warp-drive-update-readmes`
- **Create migration guide** → `warp-drive-update-guides`
- **Update package overview** → `warp-drive-update-readmes`
- **Explain a concept** → `warp-drive-update-guides`
- **Document parameters** → `warp-drive-update-api-docs`
- **Add code example to README** → `warp-drive-update-readmes`
- **General writing help** → `tech-writer-expert`

## Additional Resources

- [WarpDrive Docs](https://docs.warp-drive.io/)
- [TypeDoc Documentation](https://typedoc.org/)
- [VitePress Documentation](https://vitepress.dev/)
- [GitHub Markdown Guide](https://guides.github.com/features/mastering-markdown/)
