<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive%2Falien-signals/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/%40warp-drive%2Falien-signals.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

<h3 align="center">Signals Integration for using <em>Warp</em><strong>Drive</strong> with 👾 <strong style="color: orange">alien-signals</strong></h3>

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

*Get Started* → [Guides](https://warp-drive.io/guides/)

<br>

---

<br>

# @warp-drive/alien-signals

The reactivity integration for apps that don't use a framework integration such as
`@warp-drive/ember` or `@warp-drive/react`, and for pages that use more than one. It backs
***Warp*Drive**'s reactive data with a signals graph built on
[alien-signals](https://github.com/stackblitz/alien-signals) that other frameworks' signals register
with, and exports that graph's primitives for building framework integrations;
`@warp-drive/react` is built on them.

## Installation

```sh
pnpm add -E @warp-drive/alien-signals
```

Import it once at the top of your app, and in any test setup that doesn't boot your app. The
import calls `setupSignals` from `@warp-drive/core/configure`:

```ts
import '@warp-drive/alien-signals/install';
```

To render with more than one framework on the same page, import it before each framework's
`install` entry point:

```ts
import '@warp-drive/alien-signals/install';
import '@warp-drive/ember/install';
import '@warp-drive/react/install';
```

> [!TIP]
> Memoized values such as derived fields then only recompute when a signal ***Warp*Drive**
> manages changes. If a derivation reads state that only a framework tracks, such as an Ember
> `@tracked` property or a React `useState` value, it keeps returning its cached value when that
> state changes. Keep the state a derivation reads in ***Warp*Drive**.

---

## Documentation

- [API Docs](https://warp-drive.io/api/@warp-drive/alien-signals/): the `install` entry point, and the signals, memos and `Watcher` in `primitives`.
- [Reactivity](https://warp-drive.io/guides/the-manual/reactivity/): how ***Warp*Drive** uses signals to notify your UI, the concept this package implements.
- [Using Ember and React on the Same Page](https://warp-drive.io/guides/the-manual/cookbook/multiple-frameworks-on-one-page): sharing one store between frameworks with this package's graph.

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
