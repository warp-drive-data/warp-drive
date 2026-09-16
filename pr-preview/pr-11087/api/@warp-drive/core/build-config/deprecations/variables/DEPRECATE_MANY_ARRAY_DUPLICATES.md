---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_MANY_ARRAY_DUPLICATES.md
---

# &#x20;DEPRECATE\_MANY\_ARRAY\_DUPLICATES&#x20;

```ts
const DEPRECATE_MANY_ARRAY_DUPLICATES: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/deprecations.d.ts:400](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/deprecations.d.ts#L400)

When the flag is `true` (default), adding duplicate records to a `ManyArray`
is deprecated in non-production environments. In production environments,
duplicate records added to a `ManyArray` will be deduped and no error will
be thrown.

When the flag is `false`, an error will be thrown when duplicates are added.

## Until

6.0
