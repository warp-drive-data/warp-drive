# Technical Writing Best Practices

Technical writing expert guidance for WarpDrive documentation, covering best practices for developer documentation in open source projects.

## Table of Contents

- [Documentation Audiences](#documentation-audiences)
  - [For Humans](#for-humans)
  - [For LLMs](#for-llms)
  - [For SEO](#for-seo)
- [Cross-Documentation Strategy](#cross-documentation-strategy)
- [Documentation Workflow](#documentation-workflow)
- [Integration with Development](#integration-with-development)

---

## Documentation Audiences

Optimize all WarpDrive documentation for **three audiences**:

### For Humans

**Clarity:**
- Use clear, concise language
- Ensure logical content flow
- Provide practical examples
- Explain "why" not just "how"

**Scannability:**
- Write descriptive headings
- Keep paragraphs short
- Use bullet points and lists
- Add code examples with comments

### For LLMs

**Context:**
- Provide complete information in context
- Maintain consistent terminology
- Show clear relationships between concepts
- Include comprehensive examples
- Clearly denote recommended, legacy, and deprecated patterns

**Structure:**
- Organize content hierarchically
- Apply progressive disclosure
- Include explicit cross-references
- Define sections clearly

### For SEO

**Discoverability:**
- Write descriptive titles and headers
- Use keywords naturally
- Follow semantic HTML/markdown structure
- Provide comprehensive topic coverage

**Linking:**
- Create internal links between related topics
- Link to external authoritative sources
- Use proper anchor text
- Avoid broken links

## Cross-Documentation Strategy

Good documentation often spans multiple types:

### Common Documentation Patterns

#### Adding New Public API

1. Write TSDoc comment with `@since` tag
2. Create guide showing usage
3. Add example to package README
4. Preview all three

#### Documenting Existing Code

1. Add TSDoc comments to code
2. Check if guide needs updating
3. Verify README examples still accurate

#### Writing Tutorial

1. Create guide in appropriate section
2. Add cross-links to API docs
3. Consider README quick-start addition

#### Migration Guide

1. Create guide in `guides/migrations/`
2. Update affected API docs
3. Update README if breaking changes

### Example: New Feature

When adding a new feature, update:

1. **API Docs** - TSDoc comments for the new code
   ```ts
   /**
    * New feature for doing X
    * @since 4.1.0
    */
   ```

2. **Guides** - Tutorial showing how to use it
   - Create `guides/features/new-feature.md`
   - Add to getting-started if appropriate

3. **README** - Quick mention in package README
   - Add to "Key Features" section
   - Include minimal example
   - Add link to full guide and API Docs

### Example: Bug Fix

Typically only needs:

1. **API Docs** - If signature or behavior changed
2. Maybe **Guides** - If fix changes recommended usage

### Example: Breaking Change

Requires comprehensive updates:

1. **API Docs** - Update affected TSDoc
2. **Guides** - Create migration guide
3. **README** - Update examples

## Documentation Workflow

### Before Writing

1. **Choose format** - API docs, guide, README, or a combination?
2. **Check existing** - What's already documented?
3. **Plan structure** - How should it be organized?

### While Writing

1. **Write clearly** - Simple, direct language
2. **Add examples** - Code that actually works
3. **Link related** - Cross-reference related topics
4. **Consider all three** - Humans, LLMs, SEO

### After Writing

1. **Preview locally** - Check rendering
2. **Check links** - Ensure no broken links
3. **Get feedback** - Get feedback from user

## Integration with Development

Update documentation at these points:

**During Development:**
- Add TSDoc comments as code is written

**Before Opening PRs:**
- Update guides when changing features
- Keep README current with API changes
- Preview documentation changes
- Check links aren't broken

**In Pull Requests:**
- Briefly note what docs were changed
