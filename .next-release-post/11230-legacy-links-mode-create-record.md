---
releases: ["5.10"]
---
`store.createRecord()` no longer throws in development builds when the store comes from
`useLegacyStore({ linksMode: true })`, the setup the guides recommend for Ember apps. Apps that
overrode `adapterFor` on their store to return `undefined` to work around this can remove that
override. Calling `store.adapterFor()` directly in linksMode still asserts. See
[Setup](/guides/configuration/index.md).
