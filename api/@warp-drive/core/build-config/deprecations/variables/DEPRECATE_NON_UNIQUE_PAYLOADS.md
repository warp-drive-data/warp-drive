---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_NON_UNIQUE_PAYLOADS.md
description: >-
  Deprecation flag for hasMany relationship payloads containing duplicate
  identifiers, which were silently de-duped and will instead error.
---

# &#x20;DEPRECATE\_NON\_UNIQUE\_PAYLOADS&#x20;

```ts
const DEPRECATE_NON_UNIQUE_PAYLOADS: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/deprecations.d.ts:252](https://github.com/warp-drive-data/warp-drive/blob/04cea93913a7a25c755902c8d51a14fc830e6695/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/deprecations.d.ts#L252)

Deprecates when the data for a hasMany relationship contains
duplicate identifiers.

Previously, relationships would silently de-dupe the data
when received, but this behavior is being removed in favor
of erroring if the same related record is included multiple
times.

For instance, in JSON:API the below relationship data would
be considered invalid:

```json
{
 "data": {
  "type": "article",
   "id": "1",
   "relationships": {
     "comments": {
       "data": [
         { "type": "comment", "id": "1" },
         { "type": "comment", "id": "2" },
         { "type": "comment", "id": "1" } // duplicate
       ]
    }
 }
}
```

To resolve this deprecation, either update your server to
not include duplicate data, or implement normalization logic
in either a request handler or serializer which removes
duplicate data from relationship payloads.

## Until

6.0
