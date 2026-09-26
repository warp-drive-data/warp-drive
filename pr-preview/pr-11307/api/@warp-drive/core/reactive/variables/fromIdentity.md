---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/core/reactive/variables/fromIdentity.md
description: >-
  The `@identity` derivation, which reads a record's `id`, `lid`, `type`, or
  whole resource key for use in derived fields.
---

# &#x20;fromIdentity

```ts
const fromIdentity: FromIdentityDerivation;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:494](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/core/src/reactive/-private/schema.ts#L494)

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
