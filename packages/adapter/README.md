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

# @ember-data/adapter

> [!WARNING]
> **Legacy Package**
>
> **Adapters are a LEGACY feature** that is no longer encouraged for new applications.
>
> **Why it's legacy:** The Adapter pattern was designed for class-based, inheritance-heavy architectures where each resource type could have its own data fetching logic. This approach:
> - Creates tight coupling between your data layer and API implementation
> - Makes it difficult to compose request logic or share behavior across resource types
> - Lacks type safety and modern async patterns
> - Requires runtime resolution and increases bundle size
>
> **Modern alternative:** Use [Handlers](https://warp-drive.io/api/@warp-drive/core/request/interfaces/Handler) with the [RequestManager](https://warp-drive.io/api/@warp-drive/core/classes/RequestManager). Handlers are composable, framework-agnostic functions that process requests through a pipeline. They support:
> - Request builders for type-safe API calls
> - Middleware-style composition (Gate, Fetch, CacheHandler)
> - Better code splitting and tree shaking
> - Framework-agnostic patterns that work in React, Vue, Svelte, and Ember
>
> **When you still need this:** Only use Adapters if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive patterns. For new projects, use `@warp-drive/core` with Handlers.
>
> **Migration path:** See the [Request Handlers Guide](https://canary.warp-drive.io/guides/the-manual/requests/handlers) for the modern alternative to Adapters and Serializers.

This package provides REST and [{json:api}](https://jsonapi.org) Implementations of the legacy <a href="https://warp-drive.io/api/@warp-drive/legacy/compat/interfaces/MinimumAdapterInterface">Adapter Interface</a> when using the older packages.

For more recent installations, see [@warp-drive/legacy](https://www.npmjs.com/package/@warp-drive/legacy).

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/adapter/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/adapter/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/adapter/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/adapter/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/adapter/lts-4-12?label=%40lts-4-12&color=bbbbbb)
