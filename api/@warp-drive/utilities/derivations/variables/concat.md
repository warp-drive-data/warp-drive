---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/derivations/variables/concat.md
description: >-
  Derivation registered as `concat` that joins a record's listed `fields` into
  one string with an optional `separator`.
---

# &#x20;concat

```ts
const concat: ConcatDerivation;
```

Defined in: [derivations.ts:37](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/utilities/src/derivations.ts#L37)

A derivation for use by ReactiveResource that joins the given fields
with the optional separator (or '' if no separator is provided).

Generally you should not need to import and use this function directly.

## Example

```ts
{
 *   name: 'fullName',
 *   kind: 'derived',
 *   type: 'concat',
 *   options: {
 *     fields: ['firstName', 'lastName'],
 *     separator: ' ',
 *   },
 * }
```
