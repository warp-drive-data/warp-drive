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

# @ember-data/serializer

<p align="center">Provides JSON, REST and JSON:API Implementations of the legacy <a href="https://api.emberjs.com/ember-data/release/classes/%3CInterface%3E%20Serializer">Serializer Interface</a></p>

> [!WARNING]
> **⚠️ This is a legacy package** not recommended for new applications.
>
> **This is LEGACY documentation** for a feature that is no longer encouraged to be used.

> If starting a new app or thinking of implementing a new serializer, consider writing a [Handler](https://warp-drive.io/api/@warp-drive/core/request/interfaces/Handler)
> instead to be used with the [RequestManager](https://warp-drive.io/api/@warp-drive/core/classes/RequestManager)

## Installation

This package is currently installed when installing `ember-data`.

If installing `@ember-data/` packages individually install using your javascript package manager of choice. For instance with [pnpm](https://pnpm.io/)

```sh
pnpm add @ember-data/serializer
```

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/serializer/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/serializer/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/serializer/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/serializer/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/serializer/lts-4-12?label=%40lts-4-12&color=bbbbbb)


## 🚀 Setup

If using `ember-data` no additional setup is necesssary.

> **Note**
> When using [ember-data](https://github.com/warp-drive-data/warp-drive/blob/main/packages/-ember-data) the below
> configuration is handled for you automatically.

To use legacy serializers you will need to have installed and configured the LegacyNetworkHandler from [@ember-data/legacy-compat](https://github.com/warp-drive-data/warp-drive/blob/main/packages/-ember-data)

```sh
pnpm add @ember-data/legacy-compat
```

```ts
import Store, { CacheHandler } from '@ember-data/store';
import RequestManager from '@ember-data/request';
import { LegacyNetworkHandler } from '@ember-data/legacy-compat';

export default class extends Store {
  requestManager = new RequestManager()
    .use([LegacyNetworkHandler])
    .useCache(CacheHandler);
}
```


## Usage

To use as either a per-type or application serializer, export one of the
implementations within the `serializers/` directory of your app as appropriate.

For instance, to configure an application serializer to use `JSON:API`


*app/serializers/application.ts*
```ts
export { default } from '@ember-data/serializer/json-api';
```

By default serializers are resolved by looking for a serializer with the same name in the `serializers/` folder as the `type` given to `store.serializerFor(<type>)`, falling back to looking for a serializer named `application`.

**Overriding Resolution**

If you would like to avoid using resolver semantics and your application has only one or a few serializers, you may ovveride the `serializerFor` hook on the store.

```ts
import Store from '@ember-data/store';
import Serializer from '@ember-data/serializer/json-api';

class extends Store {
  #serializer = new Serializer();

  serializerFor() {
    return this.#serializer;
  }
}
```


For the full list of APIs available read the code documentation for [@ember-data/serializer](https://api.emberjs.com/ember-data/release/modules/@ember-data%2Fserializer). You may also be interested in learning more about *Ember***Data**'s [Serializer Interface](https://api.emberjs.com/ember-data/release/classes/%3CInterface%3E%20Serializer).
