# VitePress Markdown Features Reference

This document provides a comprehensive reference for markdown features available in VitePress, including core features and plugin extensions used in the WarpDrive documentation site.

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

::: details Click me to view the code
```js
console.log('Hello, VitePress!')
```
:::
```

### Code Blocks

#### Basic Syntax Highlighting

```markdown
```js
export default {
  name: 'MyComponent'
}
```
```

#### Line Highlighting

```markdown
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
```

#### Line Numbers

```markdown
```ts:line-numbers
// line numbers enabled
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```
```

#### Line Numbers with Start Offset

```markdown
```ts:line-numbers=5
// line numbering starts at 5
const line6 = 'This is line 6'
const line7 = 'This is line 7'
```
```

#### Focus Highlighting

```markdown
```js
export default {
  data () {
    return {
      msg: 'Focused!' // [!code focus]
    }
  }
}
```
```

#### Diff Highlighting

```markdown
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
```

#### Error and Warning Highlighting

```markdown
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
```

#### Code Groups

```markdown
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
```

### Import Code Snippets

```markdown
<<< @/filepath
```

With line highlighting:

```markdown
<<< @/filepath{highlightLines}
```

Specific lines:

```markdown
<<< @/filepath{1,3-5}
```

### Custom Anchors

```markdown
# Using custom anchors {#my-anchor}
```

Link to it:

```markdown
[Link to custom anchor](#my-anchor)
```

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

## Plugin Features

### Tabs (vitepress-plugin-tabs)

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

With shared state key (sync across multiple tab groups):

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

### Group Icons (vitepress-plugin-group-icons)

Inline icons:

```markdown
- [[typescript]] TypeScript
- [[javascript]] JavaScript
- [[vue]] Vue
```

Icon list:

```markdown
::: group-icons

- [[typescript]] Full TypeScript support
- [[vue]] Vue 3 integration
- [[vite]] Lightning fast builds

:::
```

### Footnotes (@mdit/plugin-footnote)

```markdown
Here's a sentence with a footnote.[^1]

[^1]: This is the footnote content.
```

Or inline:

```markdown
Here's a sentence with a footnote.^[Inline footnote content]
```

## Frontmatter

### Basic Frontmatter

```markdown
---
title: Page Title
description: Page description
---
```

### Layout Options

```markdown
---
layout: doc
---
```

Available layouts:
- `doc` - Default documentation layout with sidebar
- `home` - Home page layout with hero section
- `page` - Basic page without sidebar

### Hero (Home Layout)

```markdown
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

### Features (Home Layout)

```markdown
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

### Sidebar

```markdown
---
sidebar: false  # disable sidebar for this page
---
```

Or customize:

```markdown
---
sidebar: custom
---
```

### Outline

```markdown
---
outline: deep  # show all headings in outline
---
```

Or specify levels:

```markdown
---
outline: [2, 3]  # show h2 and h3 only
---
```

### Edit Link

```markdown
---
editLink: true   # enable edit link
editLink: false  # disable edit link
---
```

### Last Updated

```markdown
---
lastUpdated: true   # show last updated timestamp
lastUpdated: false  # hide last updated timestamp
---
```

### Page Class

```markdown
---
pageClass: custom-page-class
---
```

## Advanced Features

### Custom Components

Use registered Vue components:

```markdown
<Badge type="tip" text="v2.0+" />
<MyCustomComponent prop="value" />
```

### Script and Style

Add page-specific script:

```markdown
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

# Page Content

<button @click="count++">Count is: {{ count }}</button>
```

Add page-specific styles:

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

## Best Practices

### 1. Use Semantic Containers

- `tip` for best practices and recommendations
- `warning` for important caveats
- `danger` for breaking changes and critical issues
- `info` for additional context
- `details` for optional deep dives

### 2. Organize Code Examples

Use code groups when showing multiple language/framework variants:

```markdown
::: code-group

```ts [TypeScript]
const x: number = 1;
```

```js [JavaScript]
const x = 1;
```

:::
```

### 3. Highlight Important Code

Use focus, diff, error, and warning highlighting to draw attention:

```markdown
```ts
const important = 'value'; // [!code focus]
const deprecated = 'old'; // [!code warning]
const broken = 'error'; // [!code error]
```
```

### 4. Use Custom Anchors for Stability

When section names might change, use custom anchors:

```markdown
## Getting Started {#start}
```

Links to `#start` won't break if you rename the section.

### 5. Optimize Images

- Use appropriate formats (WebP, AVIF for photos, SVG for icons)
- Compress images before adding to docs
- Use descriptive alt text
- Consider using lazy loading for below-fold images

### 6. Structure Content with Outline Levels

Control what appears in the right sidebar:

```markdown
---
outline: [2, 3]  # only show h2 and h3
---
```

This helps readers navigate without overwhelming them.

### 7. Use Tabs for Alternatives

When showing different approaches or options:

```markdown
:::tabs

== REST API
Use the REST API for simple requests...

== GraphQL
Use GraphQL for complex queries...

:::
```
