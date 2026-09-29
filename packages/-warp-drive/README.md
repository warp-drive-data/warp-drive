<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/warp-drive/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/warp-drive.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

<p align="center">
  <br>
  <a href="https://warp-drive.io">WarpDrive</a> is the lightweight data library for web apps &mdash;
  <br>
  universal, typed, reactive, and ready to scale.
  <br/><br/>
</p>

***Warp*Drive** makes it easy to build scalable, fast, feature
rich applications &mdash; letting you ship better experiences more quickly without re-architecting your app or API. ***Warp*Drive** is:

- 🌌 Seamless Reactivity in any Framework
- ⚡️ Committed to Best-In-Class Performance
- 💚 Typed
- ⚛️ Works with any API
- 🌲 Focused on being as tiny as possible
- 🚀 SSR Ready
- 🐹 Built with ♥️ by [Ember](https://emberjs.com)

<br>
<br>

*Get Started* → [Guides](https://warp-drive.io/guides/)

<br>

---

# warp-drive

This package provides commandline utilities for use with WarpDrive.

<br>

## Available Commands

The CLI is also installed as `warpdrive` and `wd`, so `npx wd <command>` works too.

### Help

- `npx warp-drive help`

Prints the usage manual for every command and its options. Running `npx warp-drive` with no
command does the same.

### About

- `npx warp-drive about`

Prints a short description of what the CLI is for.

### Retrofit

- `npx warp-drive retrofit <fit>@<distTag>`

Retrofits are scripts that help you update your project. Sort of like codemods, but usually operating at the dependency configuration level instead of on specific lines of code.

Retrofits can be used both to adopt a new feature initially and upgrade the configuration of that feature to later.

#### Retrofitting to a specific version

Each retrofit updates to the configuration required for a specific npm `distTag`. For `types`, it
must be a dist-tag that `ember-data-types` publishes: currently `latest`, `beta`, `canary` or
`v4-canary`. There is no `lts` types release.

#### Available Fits

- `types`: switches an app from the DefinitelyTyped `@types/*` packages to the types packages
  ***Warp*Drive** publishes, and adds them to `tsconfig.json`.
- `mirror`: not yet available. The CLI accepts it but it throws `Not Implemented`.

#### Monorepos

Pass `--monorepo` (or `-m`) to retrofit every package in a workspace, then the workspace root,
followed by one install at the root:

```sh
npx warp-drive retrofit types@latest --monorepo
```

### Generate

- `npx warp-drive generate <type> <name> [...args]` (or `g`, `gen`)

Generates a legacy EmberData class, as JavaScript, at the path ember-cli's blueprints used, such as
`app/models/<name>.js`. The types are `model`, `adapter`, `serializer` and `transform`, plus a
unit test for each: `model-test`, `adapter-test`, `serializer-test` and `transform-test`, which
write to `tests/unit/`.

```sh
npx warp-drive generate model taco filling:belongs-to:protein toppings:has-many:topping name:string
```

- `model` takes attributes as `name:type`, and relationships as `name:belongs-to:<model>` or
  `name:has-many:<model>`.
- In an app, `adapter` and `serializer` extend your `application` adapter or serializer when
  `app/adapters/application.js` or `app/serializers/application.js` exists, and `JSONAPIAdapter`
  or `JSONAPISerializer` otherwise. Pass `--base-class=<name>` to extend a different one of yours.
- Pass `--force` to overwrite a file that already exists.

## Documentation

- [Native Types Retrofit](https://warp-drive.io/guides/the-manual/typescript/installation): what `npx warp-drive retrofit types` uninstalls, installs and configures.

### ♥️ Credits

 <details>
   <summary>Brought to you with ♥️ love by <a href="https://emberjs.com" title="EmberJS">🐹 Ember</a></summary>

  <style type="text/css">
    img.project-logo {
       padding: 0 5em 1em 5em;
       width: 200px;
       border-bottom: 1px solid #bbb;
       margin: 0 auto;
       display: block;
     }
    details > summary {
      font-size: 1.1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details {
      font-size: 1rem;
    }
    details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #000;
      border-bottom: 3px solid #0969da;
    }

    details > details {
      margin-left: 2rem;
    }
    details > details > summary {
      font-size: 1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details > details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #555;
      border-bottom: 2px solid #555;
    }
    details > details {
      font-size: .85rem;
    }

    @media (prefers-color-scheme: dark) {
      details > summary strong {
        color: #fff;
      }
    }
    @media (prefers-color-scheme: dark) {
      details > details > summary strong {
        color: #afaba0;
      border-bottom: 2px solid #afaba0;
      }
    }
  </style>
</details>
