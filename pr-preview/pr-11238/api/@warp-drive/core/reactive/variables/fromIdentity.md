---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/reactive/variables/fromIdentity.md
description: >-
  The `@identity` derivation, which reads a record's `id`, `lid`, `type`, or
  whole resource key for use in derived fields.
---

# &#x20;fromIdentity

```ts
const fromIdentity: FromIdentityDerivation;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:500](https://github.com/warp-drive-data/warp-drive/blob/16266e84cb8f768b9368b912524789ccbce1d3b1/warp-drive-packages/core/src/reactive/-private/schema.ts#L500)

A derivation that computes its value from the
record's identity.

It can be used via a derived field definition like:

```ts
{
  kind: 'derived',
  name: 'id',
  type: '@identity',
  options: { key: 'id' }
}
```

Valid keys are `'id'`, `'lid'`, `'type'`, and `'^'`.

`^` returns the entire identifier object.
