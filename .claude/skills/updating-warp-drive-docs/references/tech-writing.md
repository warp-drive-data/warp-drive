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

### In General

**Clarity:**
- Use clear, concise language
- Ensure logical content flow
- Provide practical examples
- Explain "why" not just "how"
- Focus on practical usage over implementation details

**Scannability:**
- Write descriptive headings
- Keep paragraphs short
- Use bullet points and lists
- Add code examples with comments

## Documentation Audiences

WarpDrive Guides serve several distinct audiences, each with different needs and knowledge levels:

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
- Need consistent terminology
- Require clear structure and relationships
- Require clearly denoted recommended, legacy, and deprecated patterns
- Want complete information in context
- Require clear relationships between concepts
- Require comprehensive examples
- Require content organized hierarchically
- Apply progressive disclosure

**7. Search Engines (SEO)**
- Write descriptive titles and headers
- Use keywords naturally
- Follow semantic HTML/markdown structure
- Provide comprehensive topic coverage
- Create internal links between related topics
- Link to external authoritative sources
- Use proper anchor text
- Avoid broken links

**Default Assumption:** Reader doesn't use WarpDrive yet or is just getting started.

### Audience-Specific Approaches

#### Landing Pages and Introductions (Audiences 1-3, 6-7)

Target decision makers and evaluators.

**Guidelines:**
- Entice decision makers with value propositions
- Highlight business value and ROI
- Show what problems WarpDrive solves
- Keep content accessible and compelling
- Avoid deep technical jargon
- Lead with benefits, not features

#### Guide Material (Audiences 1-4, 6-7)

Target learners and new users.

**Guidelines:**
- Start from zero historical context
- Explain concepts clearly without assumptions
- Cross-link related concepts on first introduction
- Use practical, runnable examples
- Avoid jargon without explanation
- Define terms on first use
- Build knowledge progressively

#### Migration Guides (Audiences 4-5, 6-7)

Target existing users upgrading versions.

**Guidelines:**
- Can presume historical knowledge of older concepts
- Must NOT presume knowledge of newer concepts
- Clearly mark as "Migration" in title and path
- Provide complete upgrade paths
- Explain rationale for breaking changes
- Include before/after comparisons
- Offer migration checklists

#### Legacy Content (Audiences 4-5, 6-7)

Target existing users of older patterns.

**Guidelines:**
- Keep separate from main guides
- Clearly label as "Legacy" in titles
- Example: "Setup - Legacy (Ember)" helps existing users without confusing new ones
- Shows decision makers there's support for transitions
- Provide migration paths to modern approaches
- Don't remove until usage drops significantly

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
