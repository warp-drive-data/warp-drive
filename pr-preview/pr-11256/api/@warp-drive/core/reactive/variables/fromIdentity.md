---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/reactive/variables/fromIdentity.md
description: >-
  The `@identity` derivation, which reads a record's `id`, `lid`, `type`, or
  whole resource key for use in derived fields.
---

# &#x20;fromIdentity

```ts
const fromIdentity: FromIdentityDerivation;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:497](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/core/src/reactive/-private/schema.ts#L497)

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
