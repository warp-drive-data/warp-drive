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

# @warp-drive/legacy

<br>

<p align="center">
Decommissioned Features from <em>Warp</em><strong>Drive</strong> that your App may want to continue using for a little while longer.
</p>

<br>

> [!WARNING]
> This package provides support for older ***Warp*Drive** features that have been
> deprecated and removed from [@warp-drive/core](https://canary.warp-drive.io/api/@warp-drive/core/).
>
> **Projects using these features should refactor away from them with urgency**
>
> **What's included:** This package bundles legacy implementations that were removed from the core WarpDrive packages, including:
> - Deprecated utility functions and compatibility helpers
> - Legacy snapshot implementations
> - Older patterns for working with relationships and records
> - Runtime helpers that have been replaced by more performant alternatives
>
> **Why these features were decommissioned:**
> - They relied on runtime overhead that impacted performance
> - They were tightly coupled to older architectural patterns (Models, Adapters, Serializers)
> - They prevented WarpDrive from being framework-agnostic
> - Modern alternatives provide better type safety, performance, and developer experience
>
> **Modern alternatives:** Use the core `@warp-drive/*` packages:
> - `@warp-drive/core` - Core Store, RequestManager, and schema primitives
> - `@warp-drive/json-api` - JSON:API cache implementation
> - `@warp-drive/utilities` - Modern utility functions
>
> **When you still need this:** Only install this package if:
> - You're maintaining an existing application using legacy EmberData patterns
> - You're in the middle of a migration and need these features temporarily
> - You depend on packages that require legacy APIs (`@ember-data/model`, `@ember-data/adapter`, etc.)
>
> **For new projects:** Do not use this package. Start with modern WarpDrive patterns using `@warp-drive/core`.
>
> **Migration path:** See the [V4 to V5 Migration Guide](https://canary.warp-drive.io/guides/migrating) for migrating away from legacy patterns.

## Documentation

*Get Started* → [Guides](https://docs.warp-drive.io)


<br>

## Code of Conduct

Refer to the [Code of Conduct](https://github.com/warp-drive-data/warp-drive/blob/main/CODE_OF_CONDUCT.md) for community guidelines and inclusivity.

<br>

### License

This project is licensed under the [MIT License](LICENSE.md).
