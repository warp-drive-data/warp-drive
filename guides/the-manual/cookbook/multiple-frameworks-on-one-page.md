---
description: Compose the Ember and React signal configurations with `setupSignals` so one WarpDrive store re-renders both Ember and React components on the same page.
---

# Using Ember and React on the Same Page

## In This Guide

***Warp*Drive** doesn't wrap your data in any one framework's signals. Instead, it calls a set of
[SignalHooks](/api/@warp-drive/core/configure/types/SignalHooks) whenever data is read or
changes, and each framework's `install` entry point registers the hooks for that framework. Ember
only re-renders for Ember's tags, and React only re-renders for the signals its watchers subscribe
to. So when both frameworks render the same data, the hooks need to create, consume and notify a
signal for each of them.

This guide builds a single signal configuration out of the Ember and React ones, so that one store
re-renders components in both frameworks.

- [Before You Start](#before-you-start)
- [Compose the Signal Hooks](#compose-the-signal-hooks)
- [Install the Composed Hooks](#install-the-composed-hooks)
- [Share the Store](#share-the-store)
- [Other Frameworks](#other-frameworks)

## Before You Start

This guide assumes an Ember app that also renders React components, with both
`@warp-drive/ember` and `@warp-drive/react` installed as described in
[Installation](/guides/installation/index.md). You don't need
[PolarisMode](/guides/the-manual/schemas/resources/polaris-mode.md) for this; see
[Do I need PolarisMode to share state between Ember and React on the same page?](/guides/faq/polaris-mode-with-ember-and-react.md).

## Compose the Signal Hooks

Both `@warp-drive/ember/install` and `@warp-drive/react/install` export the function they use to
build their hooks, named
[`buildSignalConfig`](/api/@warp-drive/ember/install/functions/buildSignalConfig) in each. Call
both, and pass every hook through to both results:

- `createSignal` returns a pair: an Ember tag and a React signal (a
  [Signal polyfill](https://github.com/proposal-signals/signal-polyfill) `Signal.State`).
- `consumeSignal` and `notifySignal` call each framework's hook with its half of the pair.
  Consuming a signal outside its own framework's render doesn't subscribe anything to it, so it's
  safe to always consume both.
- `createMemo` uses Ember's memo. This has a known limitation for React; see
  [Memoized Values in React Components](#memoized-values-in-react-components) below.

```ts [app/signals.ts]
import { setupSignals, type SignalHooks } from '@warp-drive/core/configure';
import { buildSignalConfig as buildEmberSignalConfig } from '@warp-drive/ember/install';
import { buildSignalConfig as buildReactSignalConfig } from '@warp-drive/react/install';

type EmberSignal = ReturnType<ReturnType<typeof buildEmberSignalConfig>['createSignal']>;
// React's `buildSignalConfig` returns untyped hooks, so its half of the pair is `unknown`.
type ComposedSignal = [ember: EmberSignal, react: unknown];

setupSignals((options): SignalHooks<ComposedSignal> => {
  const ember = buildEmberSignalConfig(options);
  const react = buildReactSignalConfig(options);

  return {
    createSignal: (obj, key) => [ember.createSignal(obj, key), react.createSignal(obj, key)],

    consumeSignal: ([emberSignal, reactSignal]) => {
      ember.consumeSignal(emberSignal);
      react.consumeSignal(reactSignal);
    },

    notifySignal: ([emberSignal, reactSignal]) => {
      ember.notifySignal(emberSignal);
      react.notifySignal(reactSignal);
    },

    // See "Memoized Values in React Components" below.
    createMemo: (obj, key, fn) => ember.createMemo(obj, key, fn),

    // Ember's runloop may flush watchers synchronously; React never does.
    willSyncFlushWatchers: () => ember.willSyncFlushWatchers() || react.willSyncFlushWatchers(),

    // Register pending requests with both Ember's and React's test waiters.
    waitFor: (promise) => ember.waitFor!(react.waitFor!(promise)),
  };
});
```

### Memoized Values in React Components

:::warning Known Limitation
React components may not re-render when a memoized value they read changes.
:::

***Warp*Drive** memoizes some values with the `createMemo` hook, including
[derived fields](/guides/the-manual/schemas/derivations.md) and some request and pagination state. Ember's memo only runs its function when its cached value is stale,
and a React component only subscribes to the signals it sees read while it renders. When a React
component reads a memoized value that is already cached, no signals are read, so the component
doesn't subscribe to the data the value depends on. That happens, for example, when an Ember
component computed the value first, or when the React component re-renders for an unrelated
reason. When that data later changes, the React component doesn't re-render.

Ember components aren't affected, and neither are plain fields, which don't use `createMemo`. A
pattern that fixes this for React is planned as a follow-up to this guide.

## Install the Composed Hooks

Import `app/signals.ts` at the top of your app's entry point and your test setup, in place of the
`import '@warp-drive/ember/install';` and `import '@warp-drive/react/install';` lines.

```ts [app/app.ts]
import './signals';
```

Importing either `install` entry point also registers that framework's hooks on its own. That's
harmless here: those modules run before the body of `app/signals.ts` does, so its `setupSignals`
call runs last and its hooks are the ones ***Warp*Drive** uses.

Because the composed `waitFor` registers each request with Ember's test waiters, `await settled()`
from `@ember/test-helpers` waits for those requests in your Ember tests.

## Share the Store

Both frameworks need to render from the same store instance, not two stores built from the same
class. Create it the usual way for Ember, then hand that instance to React's
[`StoreProvider`](/api/@warp-drive/react/functions/StoreProvider) with its `store` prop, as
[Setup - React](/guides/configuration/react.md) describes.

```tsx
<StoreProvider store={store}>
  <UserList />
</StoreProvider>
```

## Other Frameworks

The same approach works for any pair of frameworks: build each one's hooks, give `createSignal` one
signal per framework, and pass every other hook through to each. To write hooks for a framework
that doesn't have a ***Warp*Drive** package yet, see
[SignalHooks](/api/@warp-drive/core/configure/types/SignalHooks) and
[`setupSignals`](/api/@warp-drive/core/configure/functions/setupSignals).
