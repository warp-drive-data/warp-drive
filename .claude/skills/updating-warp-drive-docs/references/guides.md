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

**Example:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/good-tutorial.md`

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
- Demonstrating feature implementation

### Concept Guide

Explains architectural concepts, patterns, or how things work with examples and use cases.

**Example:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/good-concept.md`

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

**Example:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/migration-guide.md`

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

**Example:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/api-reference-guide.md`

**Characteristics:**
- Complete method signatures
- Parameter descriptions
- Return types and values
- Code examples for each method
- Error handling patterns
- Related method links

**When to use:**
- Providing detailed reference for specific APIs
- Documenting interface contracts
- Showing complete API surfaces
- Creating comprehensive method references

---

## Audience Guidelines

### Understand the Audiences

WarpDrive Guides serve six distinct audiences, each with different needs and knowledge levels:

**1. VPs and Directors**
- Evaluating if WarpDrive solves business problems
- Often heard about it at conferences
- Need business value and problem-solving focus
- Require accessible, compelling content

**2. Tech Leads and Architects**
- Deciding if it solves technical needs
- Need architectural understanding
- Require technical depth and patterns
- Want to understand integration points

**3. Hobbyists**
- Trying it for weekend projects
- Need quick-start paths
- Want clear, simple examples
- Require minimal setup friction

**4. New Engineers**
- Learning what their company uses
- Need foundational concepts
- Require step-by-step guidance
- Want clear explanations without jargon

**5. Existing Users**
- Finding documentation
- Learning deeper features
- Upgrading between versions
- Need reference and migration paths

**6. LLMs**
- Providing accurate information to AI assistants
- Need consistent terminology
- Require clear structure and relationships
- Want complete information in context

**Default Assumption:** Reader doesn't use WarpDrive yet or is just getting started.

### Audience-Specific Approaches

#### Landing Pages and Introductions (Audiences 1-3)

Target decision makers and evaluators.

**Guidelines:**
- Entice decision makers with value propositions
- Highlight business value and ROI
- Show what problems WarpDrive solves
- Keep content accessible and compelling
- Avoid deep technical jargon
- Lead with benefits, not features

#### Guide Material (Audiences 1-4)

Target learners and new users.

**Guidelines:**
- Start from zero historical context
- Explain concepts clearly without assumptions
- Cross-link related concepts on first introduction
- Use practical, runnable examples
- Avoid jargon without explanation
- Define terms on first use
- Build knowledge progressively

#### Migration Guides (Audiences 4-5)

Target existing users upgrading versions.

**Guidelines:**
- Can presume historical knowledge of older concepts
- Must NOT presume knowledge of newer concepts
- Clearly mark as "Migration" in title and path
- Provide complete upgrade paths
- Explain rationale for breaking changes
- Include before/after comparisons
- Offer migration checklists

#### Legacy Content (Audiences 4-5)

Target existing users of older patterns.

**Guidelines:**
- Keep separate from main guides
- Clearly label as "Legacy" in titles
- Example: "Setup - Legacy (Ember)" helps existing users without confusing new ones
- Shows decision makers there's support for transitions
- Provide migration paths to modern approaches
- Don't remove until usage drops significantly

#### LLM Optimization (Audience 6)

Target AI assistants and code completion tools.

**Guidelines:**
- Refer to `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/updating-warp-drive-docs/references/tech-writing.md` for LLM-specific guidelines
- Maintain consistent terminology
- Use hierarchical organization
- Include explicit cross-references
- Clearly denote recommended, legacy, and deprecated patterns
- Provide complete context within sections

### Balance Example

Balance competing audience needs through structure.

**Good Structure:**
- Top-level "Migrations" section for experienced users
- Explicitly named legacy pages (e.g., `/guides/configuration/ember`)
- Main guides assume no prior knowledge
- Clear labeling helps everyone find what they need
- Separation prevents confusion
- All audiences served without compromise

**Poor Structure:**
- Mixing legacy and modern approaches
- Assuming prior knowledge in main guides
- No clear navigation paths
- Unlabeled legacy content
- Confusing new users with historical context

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

## Common Patterns

### When to Use Each Guide Type

Select guide type based on user goals and content purpose.

**Use Tutorial Guide when:**
- Teaching a specific task completion
- Providing step-by-step instructions
- Onboarding new users
- Building something from start to finish
- User needs to "do" something specific

**Use Concept Guide when:**
- Explaining how something works
- Providing architectural understanding
- Clarifying design patterns
- Building conceptual foundations
- User needs to "understand" something

**Use Migration Guide when:**
- Documenting version upgrades
- Explaining breaking changes
- Providing deprecation paths
- Helping users transition
- User needs to "upgrade" something

**Use API Reference Guide when:**
- Documenting complete API surfaces
- Providing method-by-method reference
- Showing interface contracts
- Offering comprehensive references
- User needs to "look up" something

### Key Elements by Type

#### Tutorial Guide Elements

**Complete Template:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/good-tutorial.md`

Essential elements:
- Clear prerequisites section
- Numbered sequential steps
- Complete code examples at each step
- Expected outcomes shown
- Next steps or related tutorials
- Troubleshooting common issues

#### Concept Guide Elements

**Complete Template:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/good-concept.md`

Essential elements:
- Clear definition upfront
- Why it matters explained
- Visual examples or diagrams
- State management explanation
- Best practices section
- Related concepts linked

#### Migration Guide Elements

**Complete Template:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/migration-guide.md`

Essential elements:
- Breaking changes list
- Before/after code comparisons
- Rationale for changes
- Migration checklist
- Deprecation notices
- Version compatibility notes

#### API Reference Guide Elements

**Complete Template:** See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/api-reference-guide.md`

Essential elements:
- Complete method signatures
- Parameter descriptions with types
- Return type documentation
- Code examples for each method
- Error handling patterns
- Related method cross-references

---

## Best Practices

### Core Principles

Apply these principles consistently across all guide types.

**Clarity:**
- Use clear, concise language
- Ensure logical content flow
- Provide practical examples
- Explain "why" not just "how"
- Define terms on first use
- Avoid ambiguity

**Completeness:**
- Provide complete code examples
- Include all necessary imports
- Show expected outputs
- Document error cases
- Link related concepts
- Cover edge cases

**Consistency:**
- Maintain consistent terminology
- Use standard code formatting
- Follow naming conventions
- Apply uniform structure
- Keep style consistent

**Accessibility:**
- Start from zero assumptions
- Build knowledge progressively
- Provide multiple entry points
- Offer clear navigation
- Support different learning styles

### Writing Quality

Apply imperative/infinitive writing style without second person.

**Voice and Tone:**
- Use imperative mood for instructions ("Add the following code")
- Use infinitive for explanations ("To understand this concept")
- Avoid second person ("you", "your")
- Keep tone professional and direct
- Be concise but thorough

**Structure:**
- Write descriptive headings
- Keep paragraphs short (2-4 sentences)
- Use bullet points and lists
- Add code examples with comments
- Apply progressive disclosure

**Refer to Tech Writing Guide:**

See `/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/updating-warp-drive-docs/references/tech-writing.md` for:
- Cross-documentation strategy
- LLM optimization techniques
- SEO best practices
- Documentation workflow
- Integration with development

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

## Example Files

Working examples of well-structured guides demonstrating each pattern.

**Complete Guide Template:**
`/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/effective-guide-pattern.md`

Complete template showing guide structure, frontmatter usage, and organizational patterns.

**Tutorial Guide Example:**
`/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/good-tutorial.md`

Example tutorial guide demonstrating step-by-step instructions, prerequisites, and expected outcomes.

**Concept Guide Example:**
`/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/good-concept.md`

Example concept guide showing clear definitions, explanations, and best practices.

**Migration Guide Example:**
`/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/migration-guide.md`

Example migration guide demonstrating breaking changes, before/after comparisons, and migration checklists.

**API Reference Guide Example:**
`/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/warp-drive-update-guides/examples/api-reference-guide.md`

Example API reference guide showing complete method signatures, parameters, and usage patterns.

---

## Cross-References

Related reference documentation for comprehensive guide creation.

**Technical Writing Best Practices:**
`/Users/khuffmenne/Development/OSS/warp-drive/.claude/skills/updating-warp-drive-docs/references/tech-writing.md`

Comprehensive technical writing guidance covering:
- Documentation audiences (humans, LLMs, SEO)
- Cross-documentation strategy
- Documentation workflow
- Integration with development

**VitePress Expertise:**

VitePress-specific documentation for:
- Markdown extensions
- Custom components
- Theme configuration
- Build and deployment

**Related Skills:**

- `expert-tech-writer` - General technical writing expertise
- `vitepress-expert` - VitePress platform specifics
- `warp-drive-update-api-docs` - API documentation patterns
- `warp-drive-update-readmes` - README documentation patterns
