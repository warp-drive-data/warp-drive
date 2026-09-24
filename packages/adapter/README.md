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
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

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
> **⚠️ This is a legacy package** not recommended for new applications and **Adapters are a LEGACY feature** that is no longer encouraged.
>
> Use [Handlers](https://warp-drive.io/api/@warp-drive/core/request/types/Handler) with [@warp-drive/core](https://warp-drive.io/api/@warp-drive/core/) instead.

This package provides REST and [{json:api}](https://jsonapi.org) Implementations of the legacy <a href="https://warp-drive.io/api/@warp-drive/legacy/compat/types/MinimumAdapterInterface">Adapter Interface</a> when using the older packages.

For more recent installations, see [@warp-drive/legacy](https://www.npmjs.com/package/@warp-drive/legacy).

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/adapter/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/adapter/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/adapter/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/adapter/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/adapter/lts-4-12?label=%40lts-4-12&color=bbbbbb)

## Usage

Export one of the provided adapters from your app's `adapters/` directory:

```ts
// app/adapters/application.ts
export { default } from '@ember-data/adapter/json-api';
```

<br>

## Documentation

*Get Started* → [Guides](https://warp-drive.io/guides/)

API docs for this package → [@ember-data/adapter](https://warp-drive.io/api/@ember-data/adapter/)

<br>

## Code of Conduct

Refer to the [Code of Conduct](https://github.com/warp-drive-data/warp-drive/blob/main/CODE_OF_CONDUCT.md) for community guidelines and inclusivity.

<br>

### License

This project is licensed under the [MIT License](LICENSE.md).
