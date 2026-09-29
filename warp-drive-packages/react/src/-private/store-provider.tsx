import type { JSX, ReactNode } from "react";
import { createContext, use, useMemo } from "react";

import type { Store } from "@warp-drive/core";
import { assert } from "@warp-drive/core/build-config/macros";

/**
 * @category Contexts
 */
const StoreContext = createContext<Store | null>(null);

/**
 * Returns the Store provided by the nearest {@link StoreProvider}. In development
 * builds, calling it outside a `<StoreProvider />` throws an error.
 *
 * For how to set up the provider, see
 * [Provide the Store in React](/guides/installation/#provide-the-store-in-react).
 *
 * @example
 * ```tsx
 * import { useStore } from "@warp-drive/react";
 *
 * export function ReloadButton({ request }) {
 *   const store = useStore();
 *   return <button onClick={() => store.request(request)}>Reload</button>;
 * }
 * ```
 *
 * @summary Hook that returns the Store provided by the nearest `StoreProvider`, asserting that one exists.
 * @category Hooks
 */
export function useStore(): Store {
  const store = use(StoreContext);
  assert(
    "No Store provided via context. Please ensure you are using <StoreProvider> to provide a Store instance.",
    store
  );
  return store;
}

/**
 * The props accepted by {@link StoreProvider | `<StoreProvider />`}: `children`,
 * and either `store`, an existing Store instance to provide, or `Store`, a
 * Store class the provider creates an instance of for you.
 *
 * @example
 * ```tsx
 * import type { StoreProviderProps } from "@warp-drive/react";
 *
 * const props: StoreProviderProps = { store, children: <App /> };
 * ```
 *
 * @summary The props of the React `<StoreProvider />` component: its children plus either a Store instance or a
 * Store class to instantiate.
 * @public
 */
export type StoreProviderProps =
  | {
      /**
       * The Store instance to provide.
       */
      store: Store;
      /**
       * The components that can read the store with {@link useStore}.
       */
      children: ReactNode;
    }
  | {
      /**
       * A Store class the provider creates an instance of for you and provides.
       */
      Store: typeof Store;
      /**
       * The components that can read the store with {@link useStore}.
       */
      children: ReactNode;
    };

/**
 * Provides a Store to its children, which read it with {@link useStore}.
 * `<Request />` uses it when no `store` prop is given.
 *
 * Pass either `store`, an existing Store instance, or `Store`, a Store class
 * the provider creates an instance of for you. See {@link StoreProviderProps}.
 *
 * For where this fits in app setup, see
 * [Provide the Store in React](/guides/installation/#provide-the-store-in-react).
 *
 * @example
 * ```tsx
 * import { StoreProvider } from "@warp-drive/react";
 * import AppStore from "./services/store";
 *
 * export function App() {
 *   return (
 *     <StoreProvider Store={AppStore}>
 *       <UserPreview id="1" />
 *     </StoreProvider>
 *   );
 * }
 * ```
 *
 * @summary Component that provides a Store to its children, either the instance passed in or a new instance of the
 * Store class passed in.
 * @category Components
 * @public
 */
export function StoreProvider($props: StoreProviderProps): JSX.Element {
  const store = useMemo(
    () => ("store" in $props ? $props.store : new $props.Store()),
    ["store" in $props ? $props.store : $props.Store]
  );

  return <StoreContext value={store}>{$props.children}</StoreContext>;
}
