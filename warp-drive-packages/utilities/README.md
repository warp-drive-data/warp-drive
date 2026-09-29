<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive%2Futilities/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/%40warp-drive%2Futilities.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

# @warp-drive/utilities


<br>

<p align="center">
Utilities that Apps building with <em>Warp</em><strong>Drive</strong> may find useful.
</p>

## Usage

Build URLs and query strings, or use the request builders that compose them:

```ts
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

const baseURL = buildBaseURL({
  host: 'https://api.example.com',
  namespace: 'api/v1',
  resourcePath: 'emberDevelopers',
  op: 'query',
  identifier: { type: 'ember-developer' }
});
const url = `${baseURL}?${buildQueryParams({ name: 'Chris', include:['pets'] })}`;
// => 'https://api.example.com/api/v1/emberDevelopers?include=pets&name=Chris'
```

<br>

## Documentation

*Get Started* → [Guides](https://warp-drive.io/guides/)

API docs for this package → [@warp-drive/utilities](https://warp-drive.io/api/@warp-drive/utilities/)

- [Installation](https://warp-drive.io/guides/installation/#other-packages): install `@warp-drive/utilities` at the same version as `@warp-drive/core`.
- [Builders](https://warp-drive.io/guides/the-manual/requests/builders): write request builders, and keep cache keys stable with `sortQueryParams`, `buildQueryParams` and `filterEmpty`.
- [Making Requests](https://warp-drive.io/guides/the-manual/requests/): make a request with the `findRecord` builder, and the `AutoCompress` and `Gate` handlers.
- [Handlers](https://warp-drive.io/guides/the-manual/requests/handlers): normalize a response with `dasherize` and `singularize` from `@warp-drive/utilities/string`.
- [Typing Requests](https://warp-drive.io/guides/the-manual/requests/typing-requests): pass a response's meta type to the builders.
- [Basic Usage](https://warp-drive.io/guides/the-manual/cookbook/basic-usage): configure `setBuildURLConfig` and page through results with the `query` builder.
- [Naming Conventions](https://warp-drive.io/guides/the-manual/cookbook/naming-conventions): how `findRecord` turns a resource type into a URL path.

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
