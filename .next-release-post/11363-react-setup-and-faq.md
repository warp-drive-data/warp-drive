---
releases: ["5.10"]
---
The guides gain a [Setup - React](/guides/configuration/react.md) page and a new FAQ section:

- Setup - React covers providing the store with `<StoreProvider />` and reading it with
  `useStore`, and passing an existing instance as `store` so separately mounted React roots, or a
  host app embedding React, share one store.
- [Can I use multiple frameworks on one page?](/guides/faq/multiple-frameworks.md) and
  [Do I need PolarisMode to share state between Ember and React on the same page?](/guides/faq/polaris-mode-with-ember-and-react.md)
  answer the most common questions from apps mixing Ember and React; the short answer to the
  second is no, LegacyMode works.
