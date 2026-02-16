# Guide Documentation Patterns

Reference documentation for writing and maintaining guide documentation for WarpDrive. Guides are markdown files compiled into the manual at docs.warp-drive.io, providing tutorials, concepts, and reference material for users.

## Table of Contents

- [Guide Types](#guide-types)
  - [Tutorial Guide](#tutorial-guide)
  - [Concept Guide](#concept-guide)
  - [Migration Guide](#migration-guide)
  - [API Reference Guide](#api-reference-guide)
- [Audience Guidelines](#audience-guidelines)
  - [Understand the Audiences](#understand-the-audiences)
  - [Audience-Specific Approaches](#audience-specific-approaches)
  - [Balance Example](#balance-example)
- [Guide Structure](#guide-structure)
  - [Frontmatter Requirements](#frontmatter-requirements)
  - [File Organization](#file-organization)
- [Common Patterns](#common-patterns)
  - [When to Use Each Guide Type](#when-to-use-each-guide-type)
  - [Key Elements by Type](#key-elements-by-type)
- [Best Practices](#best-practices)
  - [Core Principles](#core-principles)
  - [Writing Quality](#writing-quality)
  - [Preview and Testing](#preview-and-testing)
- [Example Files](#example-files)
- [Cross-References](#cross-references)

---

## Guide Types

WarpDrive guides follow specific patterns based on their purpose. Each type serves different user needs and follows distinct structural conventions.

### Tutorial Guide

Step-by-step guides with complete, runnable examples that teach users how to build something specific or accomplish a task.

**Example:** See [good-tutorial.md](../examples/guides/good-tutorial.md)

**Characteristics:**
- Prescriptive step-by-step instructions
- Complete code examples at each step
- Clear prerequisites stated upfront
- Expected outcomes shown
- Numbered sequential steps

**When to use:**
- Teaching users how to build something specific
- Walking through task accomplishment
- Onboarding new users
- Demonstrating feature implementatio

### Concept Guide

Explains architectural concepts, patterns, or how things work with examples and use cases.

**Example:** See [good-concept.md](../examples/guides/good-concept.md)

**Characteristics:**
- Clear definition of the concept
- Explanation of why it matters
- Visual examples and diagrams
- State management explanation
- Best practices and patterns

**When to use:**
- Explaining architectural concepts
- Describing design patterns
- Clarifying how systems work
- Providing conceptual foundations

### Migration Guide

Shows upgrade paths between versions with breaking changes, deprecations, and migration steps.

**Example:** See [migration-guide.md](../examples/guides/migration-guide.md)

**Characteristics:**
- Breaking changes documentation
- Before/after code comparisons
- Rationale for changes
- Migration checklist
- Deprecation notices
- Version-specific guidance

**When to use:**
- Helping users upgrade between major versions
- Documenting breaking changes
- Providing deprecation paths
- Explaining API evolution

### API Reference Guide

Documents specific API surfaces comprehensively with complete method signatures and usage patterns.

**When to use:**
- Documenting complete API surfaces
- Providing method-by-method reference
- Showing interface contracts
- Offering comprehensive references
- User needs to "look up" something

See [api-docs.md](./api-docs.md) for API documentation patterns.

---

## Guide Structure

### Frontmatter Requirements

Every guide must have YAML frontmatter for proper rendering and navigation.

**Required Fields:**

```yaml
---
title: The Page Title
---
```

- `title` - Page title shown in navigation and headers

**Optional Fields:**

```yaml
---
title: The Page Title
order: 1
categoryOrder: 5
categoryTitle: Section Name
---
```

- `order` - Position within category (lower numbers first)
- `categoryOrder` - Position of category in sidebar
- `categoryTitle` - Title for category index pages

**Usage Guidelines:**

- Use `order` to sequence pages within a section
- Use `categoryOrder` on index pages to sequence sections
- Use `categoryTitle` on index pages to name sections
- Keep titles concise and descriptive
- Use title case for consistency

### File Organization

Organize guides hierarchically with clear categories.

**Standard Structure:**

```
guides/
├── index.md (landing page)
├── getting-started/
│   ├── index.md (categoryTitle, categoryOrder)
│   ├── installation.md (order: 1)
│   └── quick-start.md (order: 2)
├── concepts/
│   ├── index.md
│   ├── records.md
│   └── relationships.md
└── migrations/
    ├── index.md
    └── v3-to-v4.md
```

**Organizational Principles:**

- Group related guides in directories
- Use index.md for category landing pages
- Order pages with `order` frontmatter
- Keep paths meaningful and readable
- Separate migrations from main content
- Isolate legacy content clearly

**Path Conventions:**

- `/guides/` - Main guide landing
- `/guides/getting-started/` - Initial setup and tutorials
- `/guides/concepts/` - Conceptual explanations
- `/guides/patterns/` - Usage patterns and best practices
- `/guides/migrations/` - Version upgrade guides
- `/guides/legacy/` - Older approaches and patterns

---

## Best Practices

### Writing Style

Follow guidelines from [tech-writing.md](./tech-writing.md).

### Preview and Testing

Verify guide rendering and functionality before committing.

**Local Preview:**

From `docs-viewer/` directory:
```bash
pnpm start          # Build docs and start preview server
```

**Testing Checklist:**
- [ ] Frontmatter renders correctly
- [ ] Navigation links work
- [ ] Code examples are complete
- [ ] Images/diagrams load
- [ ] Cross-references resolve
- [ ] Formatting is correct
- [ ] Content flows logically

**Browser Testing:**

Use the chrome mcp (if available) to:
- Preview changes in full docs context
- Verify navigation structure
- Check responsive rendering
- Test interactive examples
- Validate cross-links

---

## Related References

- [vitepress.md](./vitepress.md) - VitePress features and markdown extensions
- [tech-writing.md](./tech-writing.md) - Writing style and documentation best practices
- [examples/guides/](../examples/guides/) - Guides examples
