---
url: /api/@warp-drive/holodeck/mock/functions/PUT.md
---

# &#x20;PUT()

```ts
function PUT(
   owner, 
   url, 
   response, 
   options?
): Promise<void>;
```

Defined in: [mock.ts:160](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/packages/holodeck/src/mock.ts#L160)

mock a PUT request

## Parameters

### owner

`object`

### url

`string`

### response

[`ResponseGenerator`](../type-aliases/ResponseGenerator.md)

### options?

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)<[`Scaffold`](../interfaces/Scaffold.md), `"response"` | `"url"` | `"method"`>> & `object`

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
