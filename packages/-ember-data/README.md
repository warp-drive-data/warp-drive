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
  <a href="https://warp-drive.io">WarpDrive</a>  (formerly EmberData) is the lightweight data library for web apps &mdash;
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

> [!WARNING]
> **Legacy Package**
>
> The `ember-data` package is a **legacy umbrella package** that bundles older EmberData patterns including `@ember-data/model`, `@ember-data/adapter`, and `@ember-data/serializer`.
>
> **Why it's legacy:** This package represents an older architecture based on class inheritance, runtime schema parsing, and the Adapter/Serializer pattern. Modern WarpDrive uses:
> - **`@warp-drive/core`** packages for framework-agnostic data management
> - **`@warp-drive/ember`** packages for Ember-specific integrations
> - **Schema objects** instead of Model classes
> - **Request builders** and **Handlers** instead of Adapters/Serializers
>
> **When to use this package:** Only use `ember-data` if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive patterns. For new projects or modern WarpDrive apps, install packages from `@warp-drive/*` directly.
>
> **Migration path:** See the [Guides](https://warp-drive.io/guides/) for migration strategies.

<br>

---

<br>

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/ember-data/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/ember-data/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/ember-data/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/ember-data/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/ember-data/lts-4-12?label=%40lts-4-12&color=bbbbbb)


### License

This project is licensed under the [MIT License](LICENSE.md).
