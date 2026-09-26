---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/utilities/derivations/variables/concat.md
---

# &#x20;concat

```ts
const concat: ConcatDerivation;
```

Defined in: [derivations.ts:30](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/utilities/src/derivations.ts#L30)

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
