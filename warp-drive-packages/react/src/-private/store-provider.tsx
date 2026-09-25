import type { JSX, ReactNode } from "react";
import { createContext, use, useMemo } from "react";

import type { Store } from "@warp-drive/core";
import { assert } from "@warp-drive/core/build-config/macros";

/**
 * @category Contexts
 */
const StoreContext = createContext<Store | null>(null);

/**
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

type WithExistingStore = { store: Store; children: ReactNode };
type WithNewStore = { Store: typeof Store; children: ReactNode };

/**
 * @summary Component that provides a Store to its children, either the instance passed in or a new instance of the
 * Store class passed in.
 * @category Components
 */
export function StoreProvider($props: WithExistingStore | WithNewStore): JSX.Element {
  const store = useMemo(
    () => ("store" in $props ? $props.store : new $props.Store()),
    ["store" in $props ? $props.store : $props.Store]
  );

  return <StoreContext value={store}>{$props.children}</StoreContext>;
}
