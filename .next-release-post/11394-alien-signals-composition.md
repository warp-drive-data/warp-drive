---
releases: ["5.10"]
---
Ember and React components on the same page can now share one store. The new
`@warp-drive/alien-signals` package configures a signals graph, built on
[alien-signals](https://github.com/stackblitz/alien-signals), that each framework's signals register
with instead of replacing. Import `@warp-drive/alien-signals/install` before each framework's own
`install`, and every framework re-renders when the data it read changes, including when a memo
returns a cached value; a cached read costs one signal consume per framework.

```ts
import '@warp-drive/alien-signals/install';
import '@warp-drive/ember/install';
import '@warp-drive/react/install';
```

With this setup, memoized values such as derived fields only recompute when a signal WarpDrive
manages changes, not when state only a framework tracks (like an Ember `@tracked` property)
changes. `@warp-drive/react` is now built on this graph instead of `signal-polyfill`. See
[Using Ember and React on the Same Page](/guides/the-manual/cookbook/multiple-frameworks-on-one-page.md).
