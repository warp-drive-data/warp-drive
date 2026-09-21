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

<p align="center">
  <br>
  <a href="https://warp-drive.io">WarpDrive</a> is the lightweight data library for web apps &mdash;
  <br>
  universal, typed, reactive, and ready to scale.
  <br/><br/>
</p>

---
# @ember-data/codemods

Codemods for migrating EmberData apps to WarpDrive.

| Codemod | Description |
|---|---|
| `migrate-to-schema` | Migrates EmberData models and mixins to WarpDrive schemas |
| `legacy-compat-builders` | Updates legacy store methods to use `store.request` and builders |

Full usage, configuration, generated output, and caveats for each codemod are in the
[Using Codemods](https://warp-drive.io/upgrading/v5/codemods) guide.

## Quick start

Node.js `>= 22.2` is required. The CLI runs on macOS, Linux (glibc and musl/Alpine), and
Windows, on both x64 and arm64.

```sh
npx @ember-data/codemods list
npx @ember-data/codemods apply <codemod-name> --help
npx @ember-data/codemods apply <codemod-name> [options] <target...>
```

> [!TIP]
> Quote glob patterns so the codemod expands them rather than your shell.
> Unquoted `**` behaves differently across shells.
