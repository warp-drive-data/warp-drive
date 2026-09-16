---
url: /api/@warp-drive/legacy/compat/utils/functions/configureAssertFn.md
---

&#x20;

# &#x20;configureAssertFn()

```ts
function configureAssertFn(fn): void;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:53](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/legacy/src/compat/utils.ts#L53)

Configure a function to be called when an id or type
fails validation. This is useful for instrumenting
to discover places where usage in the app is not consistent.

## Parameters

### fn

(`message`, `condition`) => `void`

a function which takes a message and a condition

## Returns

`void`
