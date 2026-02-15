---
name: warp-drive-update-readmes
description: Write and maintain README files for WarpDrive packages and the project. READMEs provide quick-start guides, installation instructions, and package overviews using GitHub-flavored markdown. Used when the user asks to "update README", "write README", "improve README documentation", "create README file", or mentions README files for WarpDrive packages or the project.
---

# WarpDrive README Documentation

You are an expert technical writer (use the /tech-writer-expert skill) responsible for writing and maintaining README files for WarpDrive packages and the project. READMEs provide quick-start guides, installation instructions, information for contributors, and package overviews using GitHub-flavored markdown.

## README Types in WarpDrive

### Package READMEs

Located at `packages/{package-name}/README.md` or `warp-drive-packages/{package-name}/README.md`

**Purpose:**
- Package overview and value proposition
- Installation instructions
- Quick-start examples
- Links to full documentation
- API highlights

**Audience:** Developers evaluating or using the specific package

### Project README

Located at project root: `README.md`

**Purpose:**
- Project overview
- Monorepo structure explanation
- Development setup instructions
- Contribution guidelines
- Links to documentation

**Audience:** Contributors, maintainers, and decision-makers

### Docs Viewer README

Located at `docs-viewer/README.md`

**Purpose:**
- Documentation preview setup
- Build instructions
- Architecture overview

**Audience:** Documentation contributors

## README Structure

See **[`references/package-readme-pattern.md`](references/package-readme-pattern.md)** for the complete package README template.

## GitHub-Flavored Markdown

See **[`references/github-markdown.md`](references/github-markdown.md)** for complete GitHub markdown syntax.

## README Best Practices

### Do's

✅ **Start with Value:**
- Lead with what problem the package solves
- Use the opening paragraph to hook readers
- Make benefits clear immediately

✅ **Provide Working Examples:**
- Include copy-paste-ready code
- Show the simplest possible usage first
- Add more complex examples progressively

✅ **Link Generously:**
- Link to full documentation
- Reference related packages
- Point to examples and guides

✅ **Keep It Current:**
- Update with API changes
- Verify examples still work
- Check links aren't broken

✅ **Show, Don't Tell:**
- Use code examples over prose
- Include actual output when helpful
- Demonstrate patterns visually

### Don'ts

❌ **Avoid Overwhelming:**
- Don't document every API detail (link to full docs)
- Don't make examples too complex
- Don't create walls of text

❌ **Don't Assume Knowledge:**
- Explain acronyms and jargon
- Provide context for concepts
- Link to prerequisite knowledge

❌ **Don't Duplicate:**
- Don't repeat full API docs in README
- Don't copy-paste from guides
- Link to authoritative sources instead

❌ **Don't Neglect Maintenance:**
- Don't let examples go stale
- Don't leave broken links
- Don't ignore deprecated features

## Package-Specific Considerations

### Core Packages

For foundational packages like `@warp-drive/core`:
- Emphasize architecture and design philosophy
- Show how other packages build on this
- Provide migration paths from alternatives

### Feature Packages

For specific features like `@warp-drive/json-api`:
- Explain when to use this package
- Show integration with core packages
- Document common configuration

### Utility Packages

For utility packages like `@warp-drive/build-config`:
- Focus on practical setup
- Show configuration examples
- Explain customization options

## Common README Sections

### Installation

Always include both npm and pnpm:

```markdown
## Installation

\`\`\`bash
npm install @warp-drive/package-name
# or
pnpm add @warp-drive/package-name
\`\`\`
```

### Usage

Start simple, add complexity:

```markdown
## Usage

Basic usage:

\`\`\`ts
import { Feature } from '@warp-drive/package-name';

const feature = new Feature();
\`\`\`

With options:

\`\`\`ts
const feature = new Feature({
  option1: true,
  option2: 'value'
});
\`\`\`
```

### API Overview

Highlight **key** APIs with links:

```markdown
## API Overview

- **`ClassName`** - Main class for feature
- **`helperFunction()`** - Utility function
- **`@decorator`** - Decorator for properties

See the [full API documentation](https://docs.warp-drive.io/api/package-name/) for details.
```

### Examples

Group by use case:

```markdown
## Examples

### Creating Records

\`\`\`ts
const { content: user } = await store.request({
  op: 'createRecord',
  data: {
    type: 'user',
    attributes: { name: 'Alice' }
  }
});
\`\`\`

### Querying Records

\`\`\`ts
const { content: users } = await store.request({
  op: 'query',
  data: {
    type: 'user',
    filter: { active: true }
  }
});
\`\`\`
```

## Updating Existing READMEs

When updating READMEs:

1. **Verify examples still work** - Test code snippets
2. **Check links** - Ensure docs links are correct
3. **Update versions** - Reflect current version numbers
4. **Add new features** - Document recent additions
5. **Remove deprecated** - Clean up old information
6. **Maintain structure** - Keep consistent organization

## Additional Resources

### Reference Files

For detailed guidance:
- **`references/github-markdown.md`** - Complete GitHub markdown syntax
- **`references/readme-examples.md`** - Real examples from WarpDrive packages

### Example Files

Working examples:
- **`examples/package-readme.md`** - Template for package READMEs
- **`examples/project-readme.md`** - Template for project README

## Quick Reference

**Essential Sections:**
1. Title and tagline
2. Overview
3. Installation
4. Quick Start
5. Key Features
6. Documentation links
7. Examples
8. Contributing
9. License

**Markdown Syntax:**
- `# Heading` - Use # for package name
- `## Section` - Use ## for major sections
- `` `code` `` - Inline code
- ` ```lang ` - Code blocks with language
- `[text](url)` - Links
- `> [!NOTE]` - GitHub alerts

**Remember:**
- Start with value proposition
- Include working code examples
- Link to full documentation
- Optimize for humans, LLMs, and SEO
- Keep it current and accurate

### README Preview

READMEs render directly on GitHub - commit and view there, or use a local markdown previewer.
