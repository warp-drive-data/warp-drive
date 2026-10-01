---
title: Setup - React
description: Provide your WarpDrive store to React components with StoreProvider, read it with useStore, and know when a component re-renders.
---

# Setup - React

This page covers the React-specific setup that comes after
[installing `@warp-drive/react`](/guides/installation/#react) and
[configuring your store](/guides/configuration/#configure-the-store).

## Provide the Store

Once you have a store class, which [Configure The Store](/guides/configuration/#configure-the-store)
creates, React components get it through React context. Wrap the app in
[`<StoreProvider />`](/api/@warp-drive/react/functions/StoreProvider) and give it that class as its
`Store` prop, and it creates the instance for you. To share a store you have already created, pass
the instance as `store` instead.

```tsx [src/app.tsx]
import { StoreProvider } from '@warp-drive/react';
import AppStore from './store';
import { UserList } from './user-list';

export function App() {
  return (
    <StoreProvider Store={AppStore}>
      <UserList />
    </StoreProvider>
  );
}
```

Any component inside the provider reads the store with
[`useStore`](/api/@warp-drive/react/functions/useStore). In development builds, calling it
outside a `<StoreProvider />` throws an error. Production builds skip that check, and it returns
`null`.

```tsx [src/reload-button.tsx]
import { useStore } from '@warp-drive/react';
import { findRecord } from '@warp-drive/utilities/json-api';

export function ReloadButton({ userId }: { userId: string }) {
  const store = useStore();

  return (
    <button onClick={() => store.request(findRecord('user', userId, { reload: true }))}>
      Reload
    </button>
  );
}
```

The React [`<Request />`](/api/@warp-drive/react/functions/Request) component reads the store
the same way when you don't pass it a `store` prop. Reading the store doesn't re-render a
component when its data changes; a
[`<ReactiveContext />`](/api/@warp-drive/react/functions/ReactiveContext) does that, and
`<Request />` already wraps its content in one. To render a request's loading, error and content
states, see [Reactive Control Flow](/guides/the-manual/reactivity/control-flow.md).
