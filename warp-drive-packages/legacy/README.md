<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive%2Flegacy/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/%40warp-drive%2Flegacy.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

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

## Usage

`useLegacyStore` produces a Store class with the legacy features switched on:

```ts
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPICache } from '@warp-drive/json-api';

export default useLegacyStore({
  // false: relationships still resolve via adapters, not links
  linksMode: false,
  // true: keep the legacy request methods and adapter/serializer infrastructure
  legacyRequests: true,
  cache: JSONAPICache,
  schemas: [],
});
```

## Documentation

*Get Started* → [Guides](https://canary.warp-drive.io/guides/)

API docs for this package → [@warp-drive/legacy](https://canary.warp-drive.io/api/@warp-drive/legacy/)

- [Setup](https://canary.warp-drive.io/guides/configuration/#configure-the-store): create a Store with `useLegacyStore` in the LegacyMode tab.
- [Legacy Feature Setup for Ember Apps](https://canary.warp-drive.io/guides/configuration/ember): which legacy features `@warp-drive/legacy` restores, and when you still need the `LegacyNetworkHandler`.
- [LegacyMode](https://canary.warp-drive.io/guides/the-manual/schemas/resources/legacy-mode): emulate `Model` with a schema, using `withDefaults` and `registerDerivations` from this package.
- [Relationships](https://canary.warp-drive.io/guides/the-manual/relational-data/): the relationship configuration pages show each relationship defined with `@warp-drive/legacy/model` as well as with schemas.
- [Typing Models & Transforms](https://canary.warp-drive.io/guides/the-manual/typescript/typing-models): type `Model` classes, their fields and their transforms.
- [Migrating 4.x to 5.x](https://canary.warp-drive.io/upgrading/v5/): move an EmberData 4.x app to 5.x with `useLegacyStore`.
- [Using Codemods](https://canary.warp-drive.io/upgrading/v5/codemods): convert Models into schemas that use `withDefaults` from this package.

<br>

## Code of Conduct

Refer to the [Code of Conduct](https://github.com/warp-drive-data/warp-drive/blob/main/CODE_OF_CONDUCT.md) for community guidelines and inclusivity.

<br>

### License

This project is licensed under the [MIT License](LICENSE.md).

### ♥️ Credits

 <details>
   <summary>Brought to you with ♥️ love by <a href="https://emberjs.com" title="EmberJS">🐹 Ember</a></summary>

  <style type="text/css">
    img.project-logo {
       padding: 0 5em 1em 5em;
       width: 100px;
       border-bottom: 2px solid #bbb;
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
      border-bottom: 3px solid #bbb;
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
