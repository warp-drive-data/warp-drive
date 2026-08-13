# @warp-drive/agent-skills

WarpDrive knowledge for AI coding agents, packaged as plain markdown.

This package has no code and no dependencies — it is a directory of markdown files, organized
by topic, meant to be read directly (by an MCP server, a build script, a human) rather than
imported. Every file under [`src`](./src) is markdown, with two exceptions used purely for
structure:

- `_meta.json` — one per directory, giving that directory's title, child ordering, and
  collapse/draft state. Directories without one are ordered alphabetically with an
  auto-generated title.
- `<name>.json` — an optional sibling of `<name>.md` carrying that file's `title`/`draft`
  metadata. Skill markdown files intentionally have **no YAML frontmatter** of their own, so
  that downstream tooling adapting this content into tool-specific formats (Claude Skills,
  Cursor rules, Copilot instructions, etc.) is free to add whatever frontmatter shape that tool
  expects without colliding with WarpDrive's own doc-site metadata.

This same `src` directory is synced into [the WarpDrive docs site](https://warp-drive.io/skills)
under the "Skills" section, using the same markdown-plus-JSON compilation tooling as the
[Guides](https://warp-drive.io/guides) section.

## Usage

Install the package and read markdown files directly from `node_modules`:

```sh
npm install @warp-drive/agent-skills
```

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('@warp-drive/agent-skills/package.json');
const skill = readFileSync(pkgPath.replace('package.json', 'schemas/define-a-resource-schema.md'), 'utf-8');
```

Or point an MCP filesystem/docs server, a Claude Code skill, or any other agent tooling at the
installed package's `src` directory.
