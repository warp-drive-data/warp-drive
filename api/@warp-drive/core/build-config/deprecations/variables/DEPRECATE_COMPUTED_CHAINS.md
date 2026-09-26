---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_COMPUTED_CHAINS.md
description: >-
  Planned deprecation flag, with no deprecation ID yet, guarding support for
  observer and computed chains on WarpDrive record arrays and ManyArrays.
---

# &#x20;DEPRECATE\_COMPUTED\_CHAINS&#x20;

```ts
const DEPRECATE_COMPUTED_CHAINS: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/deprecations.d.ts:132](https://github.com/warp-drive-data/warp-drive/blob/e3eb7533c9b678739ad1f65678b13bf640ce1833/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/deprecations.d.ts#L132)

This is a planned deprecation which will trigger when observer or computed
chains are used to watch for changes on any WarpDrive LiveArray, CollectionRecordArray,
ManyArray or PromiseManyArray.

Support for these chains is currently guarded by the deprecation flag
listed here, enabling removal of the behavior if desired.

The instrumentation was added in 5.0 but the version number
is set to 7.0 as we do not want to strip support without
adding a deprecation message.

Once we've added the deprecation message, we will
update this version number to the proper version.

## Until

8.0
