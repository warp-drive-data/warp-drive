<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive%2Fjson-api/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/%40warp-drive%2Fjson-api.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

# @warp-drive/json-api

A [{json:api}](https://jsonapi.org) Cache Implementation for ***Warp*Drive**.

`{json:api}` excels at simplifying common complex problems around cache consistency and information density, especially in regards to relational or polymorphic data.

Because most API responses can be quickly transformed into the `{json:api}` format without losing any information, ***Warp*Drive** recommends that most-if-not-all apps should use this Cache implementation.

## Usage

Hand the cache to your Store:

```ts
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export const AppStore = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    // ... your schemas here
  ],
});
```

<br>

## Documentation

*Get Started* → [Guides](https://warp-drive.io/guides/)

API docs for this package → [@warp-drive/json-api](https://warp-drive.io/api/@warp-drive/json-api/)

- [Installation](https://warp-drive.io/guides/installation/): install `@warp-drive/json-api` alongside `@warp-drive/core`.
- [Setup](https://warp-drive.io/guides/configuration/#configure-the-store): pass `JSONAPICache` to the Store.
- [Advanced Store Configuration](https://warp-drive.io/guides/configuration/advanced#add-a-cache): add the cache to a Store you build by hand.
- [Caching](https://warp-drive.io/guides/the-manual/caching/): how the `JSONAPICache` stores responses, resources, fields and relationships, and which of them a new value replaces rather than merges into.
- [Schemas](https://warp-drive.io/guides/the-manual/schemas/): how a resource in the `{json:api}` format maps onto a schema.
- [Handlers](https://warp-drive.io/guides/the-manual/requests/handlers): normalize a REST response into a `{json:api}` document the cache can consume.
- [Relationships](https://warp-drive.io/guides/the-manual/relational-data/): configure the relationships the cache keeps consistent.
- [Polymorphism](https://warp-drive.io/guides/the-manual/relational-data/features/polymorphism): polymorphic relationships and resolving an abstract type to a concrete one.

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
