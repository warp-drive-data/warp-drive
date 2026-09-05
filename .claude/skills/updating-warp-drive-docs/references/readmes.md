# README Documentation Patterns

Comprehensive guide for writing and maintaining README files in WarpDrive projects. This document covers structure, patterns, best practices, and examples for creating effective README documentation using GitHub-flavored markdown.

## Table of Contents

- [Purpose and Audiences](#purpose-and-audiences)
  - [README Types](#readme-types)
  - [Target Audiences](#target-audiences)
- [Package README Structure](#package-readme-structure)
  - [Essential Sections](#essential-sections)
  - [Section Guidelines](#section-guidelines)
  - [Complete Pattern](#complete-pattern)
- [Project README Structure](#project-readme-structure)
- [GitHub Markdown Features](#github-markdown-features)
  - [Code Blocks](#code-blocks)
  - [Alerts and Callouts](#alerts-and-callouts)
  - [Tables and Lists](#tables-and-lists)
  - [Links and Badges](#links-and-badges)
- [Best Practices](#best-practices)
  - [Writing Guidelines](#writing-guidelines)
  - [Common Patterns](#common-patterns)
  - [What to Avoid](#what-to-avoid)
- [Package-Specific Considerations](#package-specific-considerations)
- [Maintenance and Updates](#maintenance-and-updates)
- [Examples](#examples)

## Purpose and Audiences

### README Types

READMEs serve as the entry point for documentation, providing quick-start information and directing users to comprehensive documentation.

#### Package READMEs

**Location:** `packages/{package-name}/README.md` or `warp-drive-packages/{package-name}/README.md`

**Purpose:**
- Package overview and value proposition
- Installation instructions
- Quick-start examples
- Links to full documentation
- API highlights

**Audience:** Developers evaluating or using the specific package

#### Project README

**Location:** Project root `README.md`

**Purpose:**
- Project overview and vision
- Monorepo structure explanation
- Development setup instructions
- Contribution guidelines
- Links to documentation sites

**Audience:** Contributors, maintainers, and decision-makers

#### Docs Viewer README

**Location:** `docs-viewer/README.md`

**Purpose:**
- Documentation preview setup
- Build and development instructions
- Architecture overview

**Audience:** Documentation contributors

### Target Audiences

Consider these audiences when writing READMEs:

1. **Evaluators** - Developers deciding whether to use the package
2. **New Users** - Developers getting started with the package
3. **Experienced Users** - Developers seeking quick reference
4. **Contributors** - Developers wanting to contribute
5. **LLMs and AI Assistants** - Tools that parse documentation for context
6. **Search Engines** - For discoverability and SEO

## Package README Structure

### Essential Sections

Every package README must include these core sections:

1. **Title and Tagline** - Package name with brief description
2. **Overview** - What the package does and why it exists
3. **Installation** - How to add the package to a project
4. **Quick Start** - Minimal working example
5. **Key Features** - Main capabilities with examples
6. **Documentation Links** - Pointers to comprehensive docs
7. **Examples** - Common use cases and patterns
8. **Contributing** - How to contribute to the package
9. **License** - License information

### Section Guidelines

#### Title and Tagline

Start with the package name as an H1 heading followed by a concise one-line description in a blockquote.

```markdown
# @warp-drive/package-name

> Concise one-line description of what this package does and its primary benefit
```

#### Overview

Provide 2-3 paragraphs explaining:
- What problem the package solves
- Key features and capabilities
- How it fits in the WarpDrive ecosystem

Use bullet points to highlight key benefits:

```markdown
## Overview

This package provides [core functionality] for WarpDrive applications.

Key benefits:
- **Benefit 1** - Specific advantage this provides
- **Benefit 2** - How it improves developer experience
- **Benefit 3** - Performance or capability gain
```

#### Installation

Always include both npm and pnpm installation commands:

```markdown
## Installation

\`\`\`bash
npm install @warp-drive/package-name
# or
pnpm add @warp-drive/package-name
\`\`\`
```

Add version requirements using GitHub alerts when applicable:

```markdown
> [!NOTE]
> This package requires `@warp-drive/core` version 4.0 or higher.
```

#### Quick Start

Provide the simplest possible working example. Break it into numbered steps:

```markdown
## Quick Start

Get started in 3 steps:

**1. Import the package:**

\`\`\`ts
import { MainClass } from '@warp-drive/package-name';
\`\`\`

**2. Create an instance:**

\`\`\`ts
const instance = new MainClass({ option: 'value' });
\`\`\`

**3. Use it:**

\`\`\`ts
const result = await instance.doSomething();
\`\`\`
```

#### Key Features

Highlight 3-5 main features with brief descriptions and code examples:

```markdown
## Key Features

### Feature 1: Descriptive Name

Brief explanation of what this feature does and why it's useful.

\`\`\`ts
// Example demonstrating the feature
const example = new Feature({ config: 'value' });
await example.use();
\`\`\`

### Feature 2: Another Feature

Explanation of this capability.

\`\`\`ts
// Example code
const result = helperFunction(input);
\`\`\`
```

#### Documentation Links

Direct users to comprehensive documentation:

```markdown
## Documentation

For comprehensive documentation:

- **[Package Guide](https://docs.warp-drive.io/guides/packages/package-name/)** - Detailed usage and concepts
- **[API Reference](https://docs.warp-drive.io/api/package-name/)** - Complete API documentation
- **[Migration Guide](https://docs.warp-drive.io/guides/migrations/)** - Upgrading from previous versions
```

#### Common Use Cases

Organize examples by use case, progressing from simple to complex:

```markdown
## Common Use Cases

### Use Case 1: Basic Pattern

Most common usage pattern:

\`\`\`ts
import { MainClass } from '@warp-drive/package-name';

const instance = new MainClass();
const result = await instance.performAction();
\`\`\`

### Use Case 2: With Options

Customizing behavior:

\`\`\`ts
const instance = new MainClass({
  option1: true,
  option2: 'custom-value'
});
\`\`\`
```

#### API Overview

List key APIs with brief descriptions and link to full documentation:

```markdown
## API Overview

### Classes

- **`MainClass`** - Primary class for [functionality]
- **`HelperClass`** - Utility class for [specific purpose]

### Functions

- **`helperFunction(input)`** - Performs [action]
- **`utilityFunction()`** - Provides [capability]

### Decorators

- **`@decorator`** - Marks properties for [purpose]

See the [full API documentation](https://docs.warp-drive.io/api/package-name/) for complete details.
```

### Complete Pattern

See the complete package README pattern with all sections in order:

**Reference:** [`examples/readmes/package-readme-pattern.md`](../examples/readmes/package-readme-pattern.md)

**Full Example:** [`examples/readmes/package-readme.md`](../examples/readmes/package-readme.md)

## Project README Structure

Project READMEs follow a different structure focused on repository organization:

1. **Project Title** - WarpDrive or subproject name
2. **Project Description** - What the project provides
3. **Quick Links** - Documentation, guides, API reference
4. **Monorepo Structure** - Explanation of directory layout
5. **Getting Started** - Development setup instructions
6. **Available Scripts** - Common commands for development
7. **Package Overview** - List of packages in the monorepo
8. **Contributing** - Contribution process and guidelines
9. **Testing** - How to run tests
10. **Documentation** - How to build and preview docs
11. **Community** - Links to Discord, discussions, etc.
12. **License** - License information

## GitHub Markdown Features

### Code Blocks

Always specify the language for syntax highlighting:

````markdown
```typescript
const user: User = { id: '1' };
```

```bash
npm install @warp-drive/core
```

```json
{
  "type": "user",
  "id": "1"
}
```
````

Use inline code for:
- Package names: `` `@warp-drive/core` ``
- API names: `` `Store` ``, `` `findRecord()` ``
- Configuration options: `` `option: 'value'` ``

### Alerts and Callouts

GitHub supports five types of alerts:

```markdown
> [!NOTE]
> Useful information that users should know

> [!TIP]
> Helpful advice for doing things better

> [!IMPORTANT]
> Key information users need to know

> [!WARNING]
> Urgent info that needs immediate attention

> [!CAUTION]
> Advises about risks or negative outcomes
```

Use alerts sparingly and appropriately:
- **NOTE**: Version requirements, compatibility notes
- **TIP**: Performance optimizations, best practices
- **IMPORTANT**: Breaking changes, critical setup steps
- **WARNING**: Deprecated features, security considerations
- **CAUTION**: Experimental features, potential data loss

### Tables and Lists

Use tables for structured data:

```markdown
| Package | Version | Status |
|---------|---------|--------|
| @warp-drive/core | 4.0.0 | Stable |
| @warp-drive/model | 4.0.0 | Stable |
```

Use task lists for checklists:

```markdown
- [x] Completed item
- [ ] Todo item
```

Use bullet lists for features and benefits:

```markdown
- **Bold Feature** - Description
- **Another Feature** - Description
```

### Links and Badges

Link types to use:

```markdown
[External Link](https://docs.warp-drive.io/)
[Relative Link](../other-package/README.md)
[Section Link](#heading-name)
```

Optional badges for package READMEs:

```markdown
![npm version](https://img.shields.io/npm/v/@warp-drive/core)
![build status](https://github.com/warp-drive/repo/workflows/CI/badge.svg)
```

## Best Practices

### Writing Guidelines

#### Lead with Value

Start every README with a clear value proposition:

```markdown
# @warp-drive/schema-record

> Zero-cost reactive schema-based models for WarpDrive

## Overview

This package enables type-safe, reactive data models with zero runtime overhead.
Define your schema once and get full TypeScript support with automatic reactivity.
```

The opening should immediately answer:
- What does this package do?
- Why would someone use it?
- What makes it different?

#### Show, Don't Tell

Prefer code examples over prose:

**Good:**
```markdown
Create a record with the Store:

\`\`\`ts
const user = store.createRecord('user', {
  name: 'Alice',
  email: 'alice@example.com'
});
\`\`\`
```

**Bad:**
```markdown
Use the createRecord method on the Store instance to create a new record.
Pass the record type as the first argument and attributes as the second.
```

#### Progressive Disclosure

Structure information from simple to complex:

1. Quick Start - Minimal example
2. Common Use Cases - Typical patterns
3. Configuration - Customization options
4. Advanced - Complex scenarios

#### Link Generously

Connect readers to relevant resources:

```markdown
For more on schema definitions, see the [Schema Guide](https://docs.warp-drive.io/guides/schemas/).

This package works with [@warp-drive/core](../core/) and [@warp-drive/model](../model/).
```

### Common Patterns

#### Installation with Prerequisites

```markdown
## Installation

\`\`\`bash
npm install @warp-drive/package-name
# or
pnpm add @warp-drive/package-name
\`\`\`

> [!NOTE]
> This package requires `@warp-drive/core` version 4.0 or higher.
```

#### Configuration Examples

Show both basic and advanced configurations:

```markdown
## Configuration

### Basic Configuration

\`\`\`ts
const config = {
  enabled: true,
  mode: 'standard'
};
\`\`\`

### Advanced Configuration

\`\`\`ts
const config = {
  enabled: true,
  mode: 'advanced',
  hooks: {
    beforeAction: async () => { /* custom logic */ }
  }
};
\`\`\`
```

#### TypeScript Support

Highlight TypeScript capabilities:

```markdown
## TypeScript Support

This package includes full TypeScript definitions:

\`\`\`ts
import type { ConfigOptions, Result } from '@warp-drive/package-name';

const config: ConfigOptions = { option: 'value' };
const result: Result = await instance.action();
\`\`\`
```

#### Troubleshooting

Address common issues:

```markdown
## Troubleshooting

### Common Issue 1

**Problem:** Description of the issue

**Solution:**
\`\`\`ts
// Corrected approach
const fix = correctWay();
\`\`\`
```

#### Related Packages

Link to complementary packages:

```markdown
## Related Packages

- **[@warp-drive/core](../core/)** - Core WarpDrive functionality (required)
- **[@warp-drive/model](../model/)** - Data modeling capabilities
- **[@warp-drive/json-api](../json-api/)** - JSON:API adapter support
```

### What to Avoid

#### Don't Overwhelm

**Avoid:**
- Documenting every API detail in the README
- Complex examples in Quick Start
- Walls of text without code examples

**Instead:**
- Link to full API documentation
- Keep Quick Start minimal
- Use code to illustrate concepts

#### Don't Assume Knowledge

**Avoid:**
- Unexplained acronyms and jargon
- References to concepts without context
- Assuming familiarity with the ecosystem

**Instead:**
- Define terms on first use
- Provide context for concepts
- Link to prerequisite knowledge

#### Don't Duplicate

**Avoid:**
- Repeating full API docs in README
- Copy-pasting from other documentation
- Maintaining information in multiple places

**Instead:**
- Link to authoritative documentation
- Provide unique quick-start value
- Keep README focused on getting started

#### Don't Neglect Maintenance

**Avoid:**
- Stale examples that no longer work
- Broken links to documentation
- References to deprecated features

**Instead:**
- Test examples regularly
- Verify links during updates
- Update with API changes

## Package-Specific Considerations

### Core Packages

For foundational packages like `@warp-drive/core`:

- Emphasize architecture and design philosophy
- Show how other packages build on this foundation
- Provide migration paths from alternatives
- Focus on concepts and patterns

Example structure:
1. Architecture overview
2. Core concepts
3. Basic usage
4. How to extend
5. Integration with other packages

### Feature Packages

For specific features like `@warp-drive/json-api`:

- Explain when to use this package
- Show integration with core packages
- Document common configuration
- Provide real-world examples

Example structure:
1. Use cases (when to use)
2. Installation and setup
3. Configuration
4. Common patterns
5. Advanced features

### Utility Packages

For utility packages like `@warp-drive/build-config`:

- Focus on practical setup
- Show configuration examples
- Explain customization options
- Document CLI usage if applicable

Example structure:
1. Installation
2. Basic configuration
3. Configuration options
4. CLI commands
5. Customization

## Maintenance and Updates

### When to Update READMEs

Update READMEs when:

1. **API Changes** - New features or breaking changes
2. **Examples Break** - Code examples no longer work
3. **Links Break** - Documentation links are outdated
4. **New Patterns** - Common patterns emerge
5. **User Feedback** - Questions reveal unclear sections

### Update Checklist

When updating a README:

- [ ] Verify all code examples work
- [ ] Test all documentation links
- [ ] Update version numbers
- [ ] Add new features and capabilities
- [ ] Remove or mark deprecated features
- [ ] Maintain consistent structure
- [ ] Check for broken relative links
- [ ] Verify GitHub alerts render correctly

### Testing READMEs

Before committing README changes:

1. **Preview on GitHub** - Commit to a branch and view on GitHub
2. **Test Examples** - Run code examples to verify they work
3. **Check Links** - Click all links to verify they work
4. **Review Structure** - Ensure consistent section order
5. **Validate Markdown** - Check syntax and formatting

## Examples

Complete examples demonstrating README patterns:

### Package README Pattern

Essential structure for any package README:

**File:** [`examples/readmes/package-readme-pattern.md`](../examples/readmes/package-readme-pattern.md)

Shows the minimal structure with placeholders for each section.

### Complete Package README

Full example with all optional sections:

**File:** [`examples/readmes/package-readme.md`](../examples/readmes/package-readme.md)

Includes:
- Title and tagline
- Overview with benefits
- Installation instructions
- Quick Start guide
- Key Features with examples
- Documentation links
- Common Use Cases
- API Overview
- Configuration examples
- TypeScript support
- Browser support
- Performance notes
- Related packages
- Troubleshooting
- Contributing guidelines
- Changelog reference
- License information
- Support resources

### GitHub Markdown Reference

Quick reference for GitHub-flavored markdown:

**File:** [`examples/readmes/github-markdown.md`](../examples/readmes/github-markdown.md)

Covers:
- Task lists
- Tables
- Code blocks with syntax highlighting
- Alerts and callouts
- Links (external, relative, section)
- Badges

---

## Quick Reference

### README Structure Checklist

**Minimum Required Sections:**
1. Title and tagline
2. Overview
3. Installation
4. Quick Start
5. Documentation links
6. Contributing
7. License

**Recommended Additional Sections:**
- Key Features
- Common Use Cases
- API Overview
- Configuration
- Examples
- Related Packages
- Troubleshooting

### Markdown Syntax

```markdown
# Main Heading (Package Name)
## Section Heading
### Subsection Heading

**Bold Text** for emphasis
*Italic Text* for terms
`inline code` for APIs and packages

[Link Text](url)
[Relative Link](../path/file.md)

> [!NOTE]
> Alert message

- Bullet list item
- Another item

\`\`\`typescript
// Code block with syntax highlighting
const example = 'code';
\`\`\`
```

### Writing Style

- Use imperative/infinitive verb forms (not second person)
- Lead with value proposition
- Show code examples over prose
- Progress from simple to complex
- Link to comprehensive documentation
- Keep examples copy-paste ready
- Verify examples work
- Update with API changes
