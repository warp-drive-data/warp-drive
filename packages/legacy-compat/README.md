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

# @ember-data/legacy-compat

> [!CAUTION]
> **Legacy Compatibility Package**
>
> This package provides **compatibility shims** to bridge legacy EmberData patterns (Models, Adapters, Serializers) with modern WarpDrive infrastructure (RequestManager, Handlers, Cache).
>
> **Why it exists:** When migrating from legacy EmberData to modern WarpDrive, you may need to:
> - Use `@ember-data/model` classes with the new `RequestManager`
> - Keep Adapters/Serializers working while adopting new patterns incrementally
> - Maintain backward compatibility during a gradual migration
>
> **What it provides:**
> - `LegacyNetworkHandler` - Allows Adapters and Serializers to work with RequestManager
> - Compatibility layers that translate between legacy APIs and modern WarpDrive internals
> - Hooks to integrate Model classes with the modern Store
>
> **When to use this:** Only use this package during a migration from legacy EmberData to modern WarpDrive. It allows you to adopt modern patterns incrementally while keeping your existing code working.
>
> **For new projects:** Do not use this package. Start with `@warp-drive/core` and modern patterns (schemas, Handlers, request builders).
>
> **Migration path:** See the [V4 to V5 Migration Guide](https://canary.warp-drive.io/guides/migrating) and [Two Store Migration Strategy](https://canary.warp-drive.io/guides/migrating/two-store-migration) for strategies to incrementally migrate away from legacy patterns.

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/legacy-compat/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/legacy-compat/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/legacy-compat/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/legacy-compat/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/legacy-compat/lts-4-12?label=%40lts-4-12&color=bbbbbb)
