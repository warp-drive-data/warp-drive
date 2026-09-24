import type { JSX, ReactNode } from "react";
import { createContext, use, useMemo } from "react";

import type { Store } from "@warp-drive/core";
import { assert } from "@warp-drive/core/build-config/macros";

/**
 * @category Contexts
 */
const StoreContext = createContext<Store | null>(null);

/**
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
 * @category Components
 */
export function StoreProvider($props: WithExistingStore | WithNewStore): JSX.Element {
  const store = useMemo(
    () => ("store" in $props ? $props.store : new $props.Store()),
    ["store" in $props ? $props.store : $props.Store]
  );

  return <StoreContext value={store}>{$props.children}</StoreContext>;
}
