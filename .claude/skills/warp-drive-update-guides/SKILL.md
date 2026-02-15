---
name: warp-drive-update-guides
description: Write and maintain guide documentation for WarpDrive. Guides are markdown files compiled into the manual at docs.warp-drive.io, providing tutorials, concepts, and reference material for users. Use when the user asks to "write a guide", "update the guide", "create guide documentation", "add a guide page", "improve guide docs", or mentions writing guides or tutorials for WarpDrive.
---

# WarpDrive: Update Guide Documentation

You are a technical writer (use the expert-tech-writer skill) and VitePress expert (use the vitepress-expert skill) responsible for creating and maintaining guide documentation for WarpDrive. These guides provide tutorials, conceptual explanations, migration paths, and reference material for users of WarpDrive.

## Core Guide Principles

### Know Your Audience

The WarpDrive Guides serve multiple audiences:

1. **VPs and Directors** - Evaluating if WarpDrive solves business problems (heard at conferences)
2. **Tech Leads and Architects** - Deciding if it solves technical needs
3. **Hobbyists** - Trying it for weekend projects
4. **New Engineers** - Learning what their company uses
5. **Existing Users** - Finding documentation, learning deeper, or upgrading
6. **LLMs** - Providing accurate information to AI assistants

**Default Assumption:** Reader doesn't use WarpDrive yet or is just getting started.

### Audience-Specific Guidelines

**Landing Pages and Introductions (Audiences 1-3):**
- Entice decision makers
- Highlight business value
- Show what problems WarpDrive solves
- Keep it accessible and compelling

**Guide Material (Audiences 1-4):**
- Start from zero historical context
- Explain concepts clearly
- Cross-link related concepts on first introduction
- Use practical examples
- Avoid jargon without explanation

**Migration Guides (Audiences 4-5):**
- Can presume historical knowledge of older concepts
- Must NOT presume knowledge of newer concepts
- Clearly mark as "Migration" in title/path
- Provide complete upgrade paths

**Legacy Content (Audiences 4-5):**
- Keep separate from main guides
- Clearly label as "Legacy"
- Example: "Setup - Legacy (Ember)" helps existing users without confusing new ones
- Shows decision makers there's support for transitions

**LLM Optimization (Audience 6):**
- Refer to tech-writer-expert skill for LLM-specific guidelines.

### Balance Example

**Good Structure:**
- Top-level "Migrations" section for experienced users
- Explicitly named legacy pages (e.g., `/guides/configuration/ember`)
- Main guides assume no prior knowledge
- Clear labeling helps everyone find what they need

## Guide Structure

### Frontmatter

Every guide must have YAML frontmatter:

```yaml
---
title: The Page Title
order: 1  # For ordering within section
categoryOrder: 5  # For ordering sections
categoryTitle: Section Name  # For section pages
---
```

**Required Fields:**
- `title` - Page title shown in navigation and headers

**Optional Fields:**
- `order` - Position within category (lower numbers first)
- `categoryOrder` - Position of category in sidebar
- `categoryTitle` - Title for category index pages

### File Organization

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

## Preview and Testing

From `docs-viewer/`:
```bash
pnpm start          # Build docs and start preview server
```

Use the chrome mcp (if available) to preview changes in the context of the full docs.

## Common Patterns

WarpDrive guides follow specific patterns based on their purpose. See the example files for complete implementations:

### Tutorial Guide

Step-by-step guides with complete, runnable examples.

**Example:** See **`examples/good-tutorial.md`**

**When to use:** Teaching users how to build something specific or accomplish a task.

**Key elements:**
- Clear prerequisites
- Numbered steps
- Complete code examples
- Expected outcomes

### Concept Guide

Explains concepts with examples and use cases.

**Example:** See **`examples/good-concept.md`**

**When to use:** Explaining architectural concepts, patterns, or how things work.

**Key elements:**
- Clear definition
- Why it matters
- Visual examples
- State management
- Best practices

### Migration Guide

Shows upgrade paths between versions.

**Example:** See **`examples/migration-guide.md`**

**When to use:** Helping users upgrade between major versions.

**Key elements:**
- Breaking changes
- Before/after comparisons
- Why changes were made
- Migration checklist
- Deprecation notices

### API Reference Guide

Documents specific API surfaces comprehensively.

**Example:** See **`examples/api-reference-guide.md`**

**When to use:** Providing detailed reference for specific APIs or interfaces.

**Key elements:**
- Complete method signatures
- Parameter descriptions
- Return types
- Code examples
- Error handling
- Related methods

## Additional Resources

### Example Files

Working examples of well-structured guides:
- **`examples/effective-guide-pattern.md`** - Complete template for guide structure
- **`examples/good-tutorial.md`** - Example tutorial guide
- **`examples/good-concept.md`** - Example concept guide
- **`examples/migration-guide.md`** - Example migration guide
- **`examples/api-reference-guide.md`** - Example API reference guide
