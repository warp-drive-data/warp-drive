---
url: /pr-preview/pr-11117/api/@warp-drive/legacy/compat/utils/functions/expectId.md
---

&#x20;

# &#x20;expectId()

```ts
function expectId(id: string | number): string;
function expectId(id: null): never;
```

## Call Signature

```ts
function expectId(id: string | number): string;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:172](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/legacy/src/compat/utils.ts#L172)

Like [formattedId](formattedId.md), but asserts that `id` is not `null` rather
than allowing and passing through `null`.

### Parameters

#### id

`string` | `number`

### Returns

`string`

## Call Signature

```ts
function expectId(id: null): never;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:178](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/legacy/src/compat/utils.ts#L178)

Throws, since `id` is `null`.

### Parameters

#### id

`null`

### Returns

`never`
