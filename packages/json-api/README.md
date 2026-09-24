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

# @ember-data/json-api

<p align="center">Elegantly composable. Made for <strong>JSON:</strong>API</p>

> [!WARNING]
> **⚠️ This package only exists for backwards compatibility**
>
> Newer apps should use [@warp-drive/json-api](https://warp-drive.io/api/@warp-drive/json-api/) for the cache and [@warp-drive/utilities](https://warp-drive.io/api/@warp-drive/utilities/)
> for the builders it provided.


This package provides an in-memory document and resource [Cache](https://warp-drive.io/api/@warp-drive/core/types/cache/types/Cache) and associated utilities for use with [***Warp*Drive**](https://warp-drive.io) and [{json:api}](https://jsonapi.org/).

This package is intended for use with the older EmberData package setup, for use with more recent versions of WarpDrive see [@warp-drive/json-api](https://www.npmjs.com/package/@warp-drive/json-api) for the Cache and  [@warp-drive/utilities](https://www.npmjs.com/package/@warp-drive/utilities) for the builders.

`{json:api}` excels at simplifying common complex problems around cache consistency and information density, especially in regards to relational or polymorphic data.

Because most API responses can be quickly transformed into the `{json:api}` format without losing any information, ***Warp*Drive** recommends that most-if-not-all apps use a `{json:api}` cache. Apps on the `@ember-data/*` packages get it from this package; newer apps get the same cache from `@warp-drive/json-api`.

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/json-api/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/json-api/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/json-api/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/json-api/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/json-api/lts-4-12?label=%40lts-4-12&color=bbbbbb)

## Usage

```ts
import Store from '@ember-data/store';
import Cache from '@ember-data/json-api';

export default class extends Store {
  createCache(capabilities) {
    return new Cache(capabilities);
  }
}
```

Apps on the `ember-data` meta package get this configuration for free.

<br>

## Documentation

*Get Started* → [Guides](https://warp-drive.io/guides/)

API docs for this package → [@ember-data/json-api](https://warp-drive.io/api/@ember-data/json-api/)

<br>

## Code of Conduct

Refer to the [Code of Conduct](https://github.com/warp-drive-data/warp-drive/blob/main/CODE_OF_CONDUCT.md) for community guidelines and inclusivity.

<br>

### License

This project is licensed under the [MIT License](LICENSE.md).
