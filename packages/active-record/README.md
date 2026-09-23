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

# @ember-data/active-record

> [!WARNING]
> **⚠️ This package only exists for backwards compatibility**
>
> Newer apps should use [@warp-drive/utilities](https://warp-drive.io/api/@warp-drive/utilities/)


This package provides utilities for working with **Active**Record APIs with [***Warp*Drive**](https://warp-drive.io/) when using the older package configuration.

For for modern usage of these utilities, see [@warp-drive/utilities](https://www.npmjs.com/package/@warp-drive/utilities).

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/active-record/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/active-record/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/active-record/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/active-record/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/active-record/lts-4-12?label=%40lts-4-12&color=bbbbbb)

## Usage

```ts
import { findRecord } from '@ember-data/active-record/request';

const options = findRecord('ember-developer', '1', { include: ['pets', 'friends'] });
const { content } = await store.request(options);
```

<br>

## Documentation

*Get Started* → [Guides](https://warp-drive.io/guides/)

API docs for this package → [@ember-data/active-record](https://warp-drive.io/api/@ember-data/active-record/)

<br>

## Code of Conduct

Refer to the [Code of Conduct](https://github.com/warp-drive-data/warp-drive/blob/main/CODE_OF_CONDUCT.md) for community guidelines and inclusivity.

<br>

### License

This project is licensed under the [MIT License](LICENSE.md).
