<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive%2Fcore/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/%40warp-drive%2Fcore.svg?style=flat&color=fdb155)
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

***Warp*Drive** makes it easy to build scalable, fast, feature
rich applications &mdash; letting you ship better experiences more quickly without re-architecting your app or API. ***Warp*Drive** is:

- 🌌 Seamless Reactivity in any Framework
- ⚡️ Committed to Best-In-Class Performance
- 💚 Typed
- ⚛️ Works with any API
- 🌲 Focused on being as tiny as possible
- 🚀 SSR Ready
- 🐹 Built with ♥️ by [Ember](https://emberjs.com)

<br>
<br>

*Get Started* → [Guides](https://canary.warp-drive.io/guides/)

<br>

## Usage

`useRecommendedStore` produces a Store class with the recommended defaults; pair it with a cache such as [@warp-drive/json-api](https://canary.warp-drive.io/api/@warp-drive/json-api/).

```ts
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export const AppStore = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    // resource schemas, see https://canary.warp-drive.io/guides/the-manual/schemas/
  ],
});
```

This package is framework-agnostic; the bindings live in `@warp-drive/ember`, `@warp-drive/react` and `@warp-drive/vue`. Schemas describe the shape of your resources; the [Schemas guide](https://canary.warp-drive.io/guides/the-manual/schemas/) covers writing them, and the [Setup guide](https://canary.warp-drive.io/guides/configuration/) shows how each framework provides the Store to components.

<br>

---

<br>

## Documentation

API docs for this package → [@warp-drive/core](https://canary.warp-drive.io/api/@warp-drive/core/)

- [Installation](https://canary.warp-drive.io/guides/installation/): install `@warp-drive/core`, a cache and the reactivity package for your framework.
- [Setup](https://canary.warp-drive.io/guides/configuration/): configure the build plugin and create a Store with `useRecommendedStore`.
- [Advanced Store Configuration](https://canary.warp-drive.io/guides/configuration/advanced): build a Store class by hand, one piece at a time.
- [Making Requests](https://canary.warp-drive.io/guides/the-manual/requests/): `store.request`, request options and the handler chain.
- [Builders](https://canary.warp-drive.io/guides/the-manual/requests/builders): functions that return a request and a stable cache key.
- [Handlers](https://canary.warp-drive.io/guides/the-manual/requests/handlers): write a handler that transforms a response.
- [Typing Requests](https://canary.warp-drive.io/guides/the-manual/requests/typing-requests): `withResponseType` and `withReactiveResponse`.
- [Using the Response](https://canary.warp-drive.io/guides/the-manual/requests/using-the-response): the `Future` a request returns, its errors and its content.
- [Schemas](https://canary.warp-drive.io/guides/the-manual/schemas/): how a schema turns cached data into reactive properties.
- [Caching](https://canary.warp-drive.io/guides/the-manual/caching/): how the `CacheHandler` and the cache policy decide what to fetch and what to keep.
- [Key Terminology](https://canary.warp-drive.io/guides/the-manual/caching/key-terms): documents, resources and the names of their types.
- [Reactivity](https://canary.warp-drive.io/guides/the-manual/reactivity/): how ***Warp*Drive** uses signals to notify your UI.
- [Reactive Control Flow](https://canary.warp-drive.io/guides/the-manual/reactivity/control-flow): render a request's states with `getRequestState`.
- [Async as Reactive State](https://canary.warp-drive.io/guides/the-manual/reactivity/derivation): derive a promise's state with `getPromiseState`.
- [Relationships](https://canary.warp-drive.io/guides/the-manual/relational-data/): configure each kind of relationship.
- [Debugging](https://canary.warp-drive.io/guides/the-manual/debugging/): turn on debug logging at runtime or in the build config.

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
