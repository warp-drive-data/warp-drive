---
url: /api/@warp-drive/legacy/compat/utils/functions/expectId.md
---

&#x20;

# &#x20;expectId()

## Call Signature

```ts
function expectId(id): string;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:172](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/legacy/src/compat/utils.ts#L172)

Like [formattedId](formattedId.md), but asserts that `id` is not `null` rather
than allowing and passing through `null`.

### Parameters

#### id

`string` | `number`

### Returns

`string`

## Call Signature

```ts
function expectId(id): never;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:178](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/legacy/src/compat/utils.ts#L178)

Throws, since `id` is `null`.

### Parameters

#### id

`null`

### Returns

`never`
