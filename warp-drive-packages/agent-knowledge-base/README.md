<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/ember-data/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/ember-data.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS
)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S
)

# @warp-drive/agent-knowledge-base

WarpDrive knowledge for AI coding agents, packaged as plain markdown.

This package has no code and no dependencies — it is a directory of markdown files, organized
by topic, meant to be read directly (by an MCP server, a build script, a human) rather than
imported. Every file under [`skills`](./skills) is plain markdown with **no YAML frontmatter**
of its own, so that downstream tooling adapting this content into tool-specific formats (Claude
Skills, Cursor rules, Copilot instructions, etc.) is free to add whatever frontmatter shape that
tool expects without colliding with WarpDrive's own doc-site metadata.

Structure and per-file metadata instead live in a single `_meta.json` per directory:

- `title` / `collapsed` / `draft` — metadata for the directory itself. Directories without a
  `_meta.json` are ordered alphabetically with an auto-generated title.
- `items` — ordered list of child slugs (filenames without `.md`, or subdirectory names).
  Unlisted items sort alphabetically after listed ones.
- `files` — per-file metadata, keyed by filename without `.md` (e.g. `"title"`/`"draft"` for
  that file).

```json
{
  "title": "Schemas",
  "items": ["define-a-resource-schema"],
  "files": {
    "define-a-resource-schema": { "title": "Define a Resource Schema" }
  }
}
```

This same `skills` directory is synced into [the WarpDrive docs site](https://warp-drive.io/skills)
under the "Skills" section, using the same markdown-plus-JSON compilation tooling as the
[Guides](https://warp-drive.io/guides) section.

## Usage

Install the package and read markdown files directly from `node_modules`:

```sh
npm install @warp-drive/agent-knowledge-base
```

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('@warp-drive/agent-knowledge-base/package.json');
const skill = readFileSync(pkgPath.replace('package.json', 'schemas/define-a-resource-schema.md'), 'utf-8');
```

Or point an MCP filesystem/docs server, a Claude Code skill, or any other agent tooling at the
installed package's `skills` directory.
