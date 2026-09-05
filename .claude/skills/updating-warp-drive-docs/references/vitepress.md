# VitePress Complete Reference

Comprehensive reference for VitePress and its ecosystem in WarpDrive, covering configuration, plugins, markdown features, and best practices.

## Table of Contents

- [Overview](#overview)
- [Project Configuration](#project-configuration)
- [Core VitePress Features](#core-vitepress-features)
- [Plugin-Specific Features](#plugin-specific-features)
- [Markdown Features Reference](#markdown-features-reference)
- [Theme Customization](#theme-customization)
- [Configuration Patterns](#configuration-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Quick Reference Card](#quick-reference-card)

---

## Overview

WarpDrive uses VitePress with several plugins to generate a modern, fast documentation site with PWA support, optimized images, and enhanced markdown features.

### Ecosystem

- **[VitePress](https://vitepress.dev/)** - Vue-powered static site generator optimized for documentation
- **[@vite-pwa/vitepress](https://vite-pwa-org.netlify.app/frameworks/vitepress.html)** - PWA support for VitePress with service worker and offline capabilities
- **[vitepress-plugin-llms](https://github.com/brc-dd/vitepress-plugin-llms)** - LLM-friendly content generation (llms.txt)
- **[vitepress-plugin-group-icons](https://www.npmjs.com/package/vitepress-plugin-group-icons)** - Icon support for sidebar groups and content
- **[vitepress-plugin-tabs](https://www.npmjs.com/package/vitepress-plugin-tabs)** - Tabbed content support in markdown
- **[Vite](https://vite.dev/)** - Fast build tool and dev server
- **[vite-plugin-image-optimizer](https://github.com/FatehAK/vite-plugin-image-optimizer)** - Automatic image optimization during build
- **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** - PWA plugin for Vite with workbox integration
- **[Vue 3](https://vuejs.org/)** - The reactive framework VitePress is built on

### Documentation Resources

Use Context7 to query official documentation when needed. If Context7 doesn't have the information, fetch from official documentation URLs listed above.

## Project Configuration

The WarpDrive documentation site is located in `docs-viewer/docs.warp-drive.io/` with the main VitePress configuration at `docs-viewer/docs.warp-drive.io/.vitepress/config.mts`.

### Key Configuration Files

- **`docs-viewer/docs.warp-drive.io/.vitepress/config.mts`** - Main VitePress configuration
- **`docs-viewer/docs.warp-drive.io/.vitepress/theme/`** - Custom theme components and styles
- **`docs-viewer/src/site-utils.ts`** - Site utilities for guide structure and API doc processing
- **`docs-viewer/package.json`** - Dependencies and scripts

### Development Workflow

```bash
# Start dev server with live reload
cd docs-viewer
pnpm start

# Build for production
cd docs-viewer
pnpm build
```

## Core VitePress Features

### Containers

VitePress provides built-in containers for callouts:

```markdown
::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details Click to see details
This is a details block.
:::
```

### Custom Container Titles

```markdown
::: danger STOP
Danger zone, do not proceed
:::

::: tip Performance Tip
Use lazy loading for large images to improve page load times.
:::

::: warning Breaking Change
This API changed in version 2.0. See migration guide.
:::

::: info Additional Context
This feature requires TypeScript 5.0 or higher.
:::

::: details Show Implementation Details
Here's how it works under the hood...
:::
```

### Custom Anchors

```markdown
## Using custom anchors {#my-anchor}
```

Link to it:

```markdown
[Link to custom anchor](#my-anchor)
```

**Best Practice:** Use custom anchors for stability when section names might change:

```markdown
## Getting Started {#start}
```

Links to `#start` won't break if the section is renamed.

### Links

#### Internal Links

```markdown
[Getting Started](./getting-started)
[Introduction](/guide/introduction)
```

#### External Links

```markdown
[GitHub](https://github.com)
```

### Images

```markdown
![Alt text](./image.png)
![Alt text](/images/hero.png)
```

**Best Practices:**
- Images in `docs-viewer/docs.warp-drive.io/public/` are served from root
- Reference with absolute paths: `/images/diagram.png`
- Images are automatically optimized during build
- Use appropriate formats (WebP, AVIF for photos, SVG for icons)
- Compress images before adding to docs
- Use descriptive alt text

### Tables

```markdown
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
```

### Emoji

```markdown
:tada: :100:
```

### Table of Contents

```markdown
[[toc]]
```

### Math Equations (if enabled)

```markdown
Inline: $a^2 + b^2 = c^2$

Block:
$$
\frac{1}{2}
$$
```

## Plugin-Specific Features

### @vite-pwa/vitepress

Configured with `withPwa()` wrapper.

**Features:**
- Service worker caches pages and assets
- Install prompt for mobile users
- Automatic updates when new content is published
- Offline access support

**Configuration Example:**

```typescript
import { withPwa } from '@vite-pwa/vitepress';

export default withPwa(defineConfig({
  // VitePress config
}));
```

**Troubleshooting:**

1. **Service worker not updating:**
   - Clear browser cache
   - Check workbox configuration
   - Verify manifest.json is accessible

2. **Large assets not cached:**
   - Increase `maximumFileSizeToCacheInBytes` in PWA config

### vitepress-plugin-llms

Automatically generates `llms.txt` for LLM context.

**Features:**
- Creates machine-readable documentation index
- Helps LLMs understand project structure
- Automatically generated during build

### vitepress-plugin-group-icons

Adds icons to sidebar groups and markdown content.

**Inline Icons:**

```markdown
- [[typescript]] TypeScript
- [[javascript]] JavaScript
- [[vue]] Vue
```

**Icon List:**

```markdown
::: group-icons

- [[typescript]] Full TypeScript support
- [[vue]] Vue 3 integration
- [[vite]] Lightning fast builds

:::
```

**In Sidebar Configuration:**

```typescript
sidebar: [
  {
    text: '[[typescript]] Getting Started',
    items: [...]
  }
]
```

### vitepress-plugin-tabs

Adds tabbed content support.

**Basic Syntax:**

```markdown
:::tabs

== Tab 1
Content for tab 1

== Tab 2
Content for tab 2

== Tab 3
Content for tab 3

:::
```

**Synced Tabs with State Key:**

Use the same key across multiple tab groups to keep them synchronized:

```markdown
:::tabs key:example

== Option A
Content A

== Option B
Content B

:::

:::tabs key:example

== Option A
More content A

== Option B
More content B

:::
```

**Use Cases:**
- Show different approaches or options
- Present framework-specific examples
- Display configuration variants

### vite-plugin-image-optimizer

Optimizes images during build.

**Features:**
- Automatic compression
- Format conversion
- Progressive loading support
- Works with common image formats

**Configuration:** Set in Vite config section

## Markdown Features Reference

### Code Blocks

#### Basic Syntax Highlighting

````markdown
```js
export default {
  name: 'MyComponent'
}
```
````

#### Line Highlighting

````markdown
```js{1,4,6-8}
export default { // highlighted
  data () {
    return {
      msg: `Highlighted!` // highlighted
    }
  },
  computed: { // highlighted
    msg2() { return '...' } // highlighted
  } // highlighted
}
```
````

Highlight specific lines:

````markdown
```ts {2-4}
function example() {
  const a = 1;  // highlighted
  const b = 2;  // highlighted
  const c = 3;  // highlighted
  return a + b + c;
}
```
````

#### Line Numbers

````markdown
```ts:line-numbers
// line numbers enabled
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```
````

#### Line Numbers with Start Offset

````markdown
```ts:line-numbers=5
// line numbering starts at 5
const line6 = 'This is line 6'
const line7 = 'This is line 7'
```
````

#### Focus Highlighting

````markdown
```js
export default {
  data () {
    return {
      msg: 'Focused!' // [!code focus]
    }
  }
}
```
````

Or:

````markdown
```ts
function example() {
  return 42; // [!code focus]
}
```
````

#### Diff Highlighting

````markdown
```js
export default {
  data () {
    return {
      msg: 'Removed' // [!code --]
      msg: 'Added' // [!code ++]
    }
  }
}
```
````

Or:

````markdown
```ts
function example() {
  return 41; // [!code --]
  return 42; // [!code ++]
}
```
````

#### Error and Warning Highlighting

````markdown
```js
export default {
  data () {
    return {
      msg: 'Error', // [!code error]
      bar: 'Warning' // [!code warning]
    }
  }
}
```
````

Or:

````markdown
```ts
function example() {
  console.log('error'); // [!code error]
  console.log('warning'); // [!code warning]
}
```
````

#### Code Groups

````markdown
::: code-group

```js [config.js]
export default {
  // config
}
```

```ts [config.ts]
export default {
  // config
}
```

:::
````

**Best Practice:** Use code groups when showing multiple language/framework variants:

````markdown
::: code-group

```ts [TypeScript]
const store = new Store({
  adapter: new JSONAPIAdapter()
});
```

```js [JavaScript]
const store = new Store({
  adapter: new JSONAPIAdapter()
});
```

:::
````

### Import Code Snippets

**Basic Import:**

```markdown
<<< @/filepath
```

**With Line Highlighting:**

```markdown
<<< @/filepath{highlightLines}
```

**Specific Lines:**

```markdown
<<< @/filepath{1,3-5}
```

**Example:**

```markdown
<<< @/snippets/example.ts{2-5}
```

### Frontmatter Configuration

#### Basic Frontmatter

```yaml
---
title: Page Title
description: Page description for meta tags
---
```

#### Layout Options

```yaml
---
layout: doc
---
```

Available layouts:
- `doc` - Default documentation layout with sidebar
- `home` - Home page layout with hero section
- `page` - Basic page without sidebar

#### Hero (Home Layout)

```yaml
---
layout: home

hero:
  name: Project Name
  text: A tagline
  tagline: Another tagline
  image:
    src: /logo.png
    alt: Project logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/user/repo
---
```

#### Features (Home Layout)

```yaml
---
layout: home

features:
  - icon: 🚀
    title: Fast
    details: Lightning fast build times
  - icon: 🔥
    title: Modern
    details: Uses latest web technologies
---
```

#### Sidebar Control

```yaml
---
sidebar: false  # disable sidebar for this page
---
```

Or customize:

```yaml
---
sidebar: custom
---
```

#### Outline Configuration

```yaml
---
outline: deep  # show all headings in outline
---
```

Or specify levels:

```yaml
---
outline: [2, 3]  # show h2 and h3 only
---
```

**Best Practice:** Control what appears in the right sidebar to help readers navigate without overwhelming them.

#### Edit Link

```yaml
---
editLink: true   # enable edit link
editLink: false  # disable edit link
---
```

#### Last Updated

```yaml
---
lastUpdated: true   # show last updated timestamp
lastUpdated: false  # hide last updated timestamp
---
```

#### Page Class

```yaml
---
pageClass: custom-page-class
---
```

#### Display Order

```yaml
---
order: 1
---
```

## Theme Customization

### Custom CSS

Custom styles are in `docs-viewer/docs.warp-drive.io/.vitepress/theme/custom.css`.

### Vue Components

VitePress supports adding custom Vue components in `.vitepress/theme/components/`.

**Using Registered Components:**

```markdown
<Badge type="tip" text="v2.0+" />
<MyCustomComponent prop="value" />
```

### Script and Style in Markdown

**Add page-specific script:**

```markdown
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

# Page Content

<button @click="count++">Count is: {{ count }}</button>
```

**Add page-specific styles:**

```markdown
<style scoped>
.custom-class {
  color: red;
}
</style>
```

### Using Vue in Markdown

```markdown
{{ 1 + 1 }}

{{ new Date().toLocaleDateString() }}
```

### Raw HTML

```markdown
<div class="custom-block">
  Raw HTML content
</div>
```

## Configuration Patterns

### Navigation Configuration

```typescript
export default defineConfig({
  themeConfig: {
    nav: [
      { text: 'Guides', link: '/guides' },
      { text: 'API Docs', link: '/api' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/guides/intro' },
          { text: 'Installation', link: '/guides/install' },
        ],
      },
    ],
  },
});
```

### Search Configuration

```typescript
export default defineConfig({
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        // customize search
      },
    },
  },
});
```

### Social Links

```typescript
export default defineConfig({
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/warp-drive-data/warp-drive' },
      { icon: 'discord', link: 'https://discord.gg/PHBbnWJx5S' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/warp-drive.io' },
    ],
  },
});
```

### Edit Link Configuration

```typescript
export default defineConfig({
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/warp-drive-data/warp-drive/edit/main/:path',
    },
  },
});
```

### Dead Link Detection

```typescript
export default defineConfig({
  ignoreDeadLinks: false, // catch broken links during build
});
```

**Best Practices:**
- Use `ignoreDeadLinks: false` to catch broken links during build
- Check relative paths are correct
- Verify external links are accessible

## Best Practices

### 1. Use VitePress Containers for Callouts

Leverage semantic containers for different types of information:

```markdown
::: tip Performance Tip
Use lazy loading for large images to improve page load times.
:::

::: warning Breaking Change
This API changed in version 2.0. See migration guide.
:::

::: danger Security Notice
Never expose API keys in client-side code.
:::

::: info Additional Context
This feature requires TypeScript 5.0 or higher.
:::

::: details Show Implementation Details
Here's how it works under the hood...
:::
```

**Container Guidelines:**
- `tip` - Best practices and recommendations
- `warning` - Important caveats and considerations
- `danger` - Breaking changes, critical issues, and security warnings
- `info` - Additional context and supplementary information
- `details` - Optional deep dives and implementation details

### 2. Leverage Code Groups for Multi-Language Examples

Use code groups when showing multiple language/framework variants:

````markdown
::: code-group

```ts [TypeScript]
const store = new Store({
  adapter: new JSONAPIAdapter()
});
```

```js [JavaScript]
const store = new Store({
  adapter: new JSONAPIAdapter()
});
```

:::
````

### 3. Use Tabs Plugin for Alternative Approaches

When showing different approaches or options:

```markdown
:::tabs

== Option A
This approach uses the default configuration.

== Option B
This approach uses a custom configuration.

:::
```

**Use Cases:**
- Framework-specific implementations
- Configuration variants
- Different API approaches

### 4. Add Icons to Content with Group Icons Plugin

```markdown
::: group-icons

- [[typescript]] TypeScript Support
- [[vue]] Vue Integration
- [[vite]] Fast Build Times

:::
```

### 5. Optimize Images for Performance

Images are automatically optimized during build. Follow these guidelines:

- Place images in `docs-viewer/docs.warp-drive.io/public/` for static assets
- Reference with absolute paths: `/images/diagram.png`
- Use appropriate formats (WebP, AVIF for photos, SVG for icons)
- Compress images before adding to docs
- Use descriptive alt text
- Consider lazy loading for below-fold images

### 6. Enable PWA Features

The site is configured with PWA support for offline access:

- Service worker caches pages and assets
- Install prompt for mobile users
- Automatic updates when new content is published

### 7. Highlight Important Code

Use focus, diff, error, and warning highlighting to draw attention:

````markdown
```ts
const important = 'value'; // [!code focus]
const deprecated = 'old'; // [!code warning]
const broken = 'error'; // [!code error]
```
````

### 8. Use Custom Anchors for Stability

When section names might change, use custom anchors:

```markdown
## Getting Started {#start}
```

Links to `#start` won't break if you rename the section.

### 9. Structure Content with Outline Levels

Control what appears in the right sidebar:

```yaml
---
outline: [2, 3]  # only show h2 and h3
---
```

This helps readers navigate without overwhelming them.

### 10. Organize Code Examples Effectively

**Line Numbers for Long Examples:**

````markdown
```ts:line-numbers
// Complex example
function complexFunction() {
  // multiple lines
}
```
````

**Highlight Key Lines:**

````markdown
```ts{3-5}
function example() {
  const setup = true;
  const important = 'value';  // highlighted
  const critical = 'data';    // highlighted
  const key = 'info';         // highlighted
  return { important, critical, key };
}
```
````

**Show Diffs for Changes:**

````markdown
```ts
function example() {
  return 41; // [!code --]
  return 42; // [!code ++]
}
```
````

## Troubleshooting

### Build Failures

1. **Clear cache and rebuild:**
   ```bash
   rm -rf docs-viewer/.vitepress/cache
   pnpm build
   ```

2. **Check for circular dependencies** in frontmatter or imports

3. **Verify markdown syntax** - unclosed containers or code blocks cause failures

**Common Issues:**
- Missing closing `:::` for containers
- Unclosed code blocks
- Invalid frontmatter YAML syntax

### Dead Links

- Use `ignoreDeadLinks: false` to catch broken links during build
- Check relative paths are correct
- Verify external links are accessible

**Debugging Steps:**
1. Build with `pnpm build` to see link errors
2. Check for typos in internal links
3. Verify file paths match actual file locations
4. Test external URLs are reachable

### Plugin Issues

1. **Plugin not working:**
   - Check plugin is registered in correct config section (markdown.config vs vite.plugins)
   - Verify plugin order - some plugins depend on others
   - Check plugin version compatibility with VitePress version

2. **Markdown not rendering:**
   - Ensure proper spacing around markdown plugin syntax
   - Check for conflicting plugins
   - Verify markdown-it configuration

3. **Icons not showing:**
   - Check icon name is valid for group-icons plugin
   - Verify plugin is properly imported and configured
   - Ensure proper syntax: `[[icon-name]]`

4. **Tabs not working:**
   - Verify proper spacing after `:::tabs`
   - Check `==` syntax for tab labels
   - Ensure closing `:::`

### PWA Issues

1. **Service worker not updating:**
   - Clear browser cache
   - Check workbox configuration
   - Verify manifest.json is accessible
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

2. **Large assets not cached:**
   - Increase `maximumFileSizeToCacheInBytes` in PWA config
   - Check asset size limits

3. **Install prompt not showing:**
   - Verify manifest.json is valid
   - Check PWA criteria are met
   - Test on HTTPS (required for PWA)

### Performance Issues

1. **Slow dev server:**
   - Check for large images - optimize them first
   - Reduce number of pages loaded at once
   - Use `vite.server.warmup` to pre-bundle dependencies
   - Clear `.vitepress/cache` directory

2. **Slow build:**
   - Enable parallel processing
   - Optimize images before adding to docs
   - Check for excessive plugin processing
   - Review bundle size and dependencies

3. **Large bundle size:**
   - Audit dependencies
   - Enable code splitting
   - Optimize images
   - Review custom components

### Dev Server Issues

1. **Changes not reflecting:**
   - Restart dev server
   - Clear cache: `rm -rf .vitepress/cache`
   - Check file is being watched
   - Verify file is in correct location

2. **Hot reload not working:**
   - Check for syntax errors in config
   - Verify Vite config is valid
   - Restart dev server

3. **Port conflicts:**
   - Change port in config
   - Kill conflicting process
   - Use different port: `pnpm start --port 3000`

## Quick Reference Card

### Essential Containers

- `::: tip` - Tips and best practices
- `::: warning` - Important warnings
- `::: danger` - Critical security/breaking changes
- `::: info` - Additional context
- `::: details` - Collapsible details

### Code Features

- `{2-4}` - Line highlighting
- `:line-numbers` - Show line numbers
- `:line-numbers=5` - Start line numbers at 5
- `// [!code focus]` - Focus lines
- `// [!code ++]` / `// [!code --]` - Diff highlighting
- `// [!code error]` / `// [!code warning]` - Error/warning highlighting

### Plugins

**Tabs:**
```markdown
:::tabs
== Tab 1
Content
:::
```

**Icons:**
```markdown
[[icon-name]] in content
```

**PWA:**
- Automatic offline support
- Service worker caching
- Install prompts

**LLMS:**
- Automatic llms.txt generation

**Images:**
- Automatic optimization during build

### Common Patterns

**Code Groups:**
````markdown
::: code-group
```ts [TypeScript]
code
```
```js [JavaScript]
code
```
:::
````

**Custom Anchors:**
```markdown
## Heading {#custom-id}
```

**Import Snippets:**
```markdown
<<< @/snippets/example.ts{2-5}
```

**Synced Tabs:**
```markdown
:::tabs key:mykey
== Option A
:::
```

### Frontmatter Quick Reference

```yaml
---
title: Page Title
description: Page description
layout: doc
sidebar: true
outline: [2, 3]
order: 1
editLink: true
lastUpdated: true
---
```

### Remember

✅ **DO:**
- Use containers for callouts
- Optimize images before adding
- Use tabs for alternatives
- Add custom anchors for stability
- Enable outline levels appropriately
- Use code groups for multi-language examples
- Leverage PWA features for offline support
- Test build before committing

❌ **DON'T:**
- Use unoptimized large images
- Forget closing `:::` for containers
- Skip custom anchors for important sections
- Ignore build warnings
- Use relative paths for public assets

**Development Flow:**
1. Start dev server: `cd docs-viewer && pnpm start`
2. Make changes and preview
3. Test build: `pnpm build`
4. Check for dead links
5. Verify plugin features work
6. Commit changes

**Key Locations:**
- Config: `docs-viewer/docs.warp-drive.io/.vitepress/config.mts`
- Theme: `docs-viewer/docs.warp-drive.io/.vitepress/theme/`
- Public assets: `docs-viewer/docs.warp-drive.io/public/`
- Custom styles: `.vitepress/theme/custom.css`

**Build Commands:**
- Dev: `pnpm start`
- Build: `pnpm build`
- Preview: `pnpm preview`

**Troubleshooting Quick Fixes:**
- Clear cache: `rm -rf docs-viewer/.vitepress/cache`
- Restart dev server
- Check browser console for client-side errors
- Verify markdown syntax
- Test external links

## Working with VitePress

When working with VitePress:

1. **Check project config first** - Read `docs-viewer/docs.warp-drive.io/.vitepress/config.mts`
2. **Understand the context** - Determine if it's about markdown, configuration, or plugins
3. **Query documentation if needed** - Use context7 or WebFetch for official docs
4. **Provide accurate guidance** - Based on project config and VitePress best practices
5. **Show examples** - Provide code examples following project conventions
6. **Test locally if possible** - Changes to VitePress can be previewed with `pnpm start`

Be proactive about:
- Catching incorrect markdown syntax
- Recommending appropriate VitePress features
- Suggesting plugin usage when applicable
- Ensuring consistent styling with container types
- Verifying configuration alignment with installed plugins
- Optimizing for performance and SEO
- Leveraging PWA features for better user experience
