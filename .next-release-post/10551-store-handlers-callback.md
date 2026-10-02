---
releases: ["5.9"]
---
The `handlers` option of `useRecommendedStore` (`@warp-drive/core`) and `useLegacyStore`
(`@warp-drive/legacy`) also accepts a function. It receives the store and returns the handler
list. It runs once per store, the first time `store.requestManager` is read, so handlers can
depend on the store or its owner, such as an Ember service. Both functions' API docs gain an
"Adding Stateful Handlers" example.

```ts
export default useRecommendedStore({
  cache: JSONAPICache,
  handlers: (store) => {
    const authHandler = new AuthHandler();
    setOwner(authHandler, getOwner(store)!);
    return [authHandler];
  },
});
```
