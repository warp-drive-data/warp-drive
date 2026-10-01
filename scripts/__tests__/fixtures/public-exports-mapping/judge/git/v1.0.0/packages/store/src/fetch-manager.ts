class FetchManagerImpl {
  pending = new Map<string, Promise<unknown>>();
}

/**
 * The store's shared fetch manager.
 */
export const fetchManager = new FetchManagerImpl();
