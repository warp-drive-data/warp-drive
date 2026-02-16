# GitHub-Flavored Markdown

READMEs use GitHub-flavored markdown with these features:

## Task Lists

```markdown
- [x] Completed item
- [ ] Todo item
```

## Tables

```markdown
| Package | Version | Status |
|---------|---------|--------|
| @warp-drive/core | 4.0.0 | Stable |
| @warp-drive/model | 4.0.0 | Stable |
```

## Code Blocks with Syntax

````markdown
```typescript
const user: User = { id: '1' };
```

```bash
npm install @warp-drive/core
```
````

## Alerts (Callouts)

```markdown
> [!NOTE]
> Useful information

> [!TIP]
> Helpful advice

> [!IMPORTANT]
> Key information

> [!WARNING]
> Critical attention needed

> [!CAUTION]
> Potential risks
```

## Links

```markdown
[Text](url)
[Relative](../other/file.md)
[Section](#heading-name)
```

## Badges

```markdown
![npm version](https://img.shields.io/npm/v/@warp-drive/core)
![build status](https://github.com/warp-drive/repo/workflows/CI/badge.svg)
```
