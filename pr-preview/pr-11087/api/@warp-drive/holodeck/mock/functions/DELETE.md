---
url: /pr-preview/pr-11087/api/@warp-drive/holodeck/mock/functions/DELETE.md
---

# &#x20;DELETE()

```ts
function DELETE(
   owner, 
   url, 
   response, 
   options?
): Promise<void>;
```

Defined in: [mock.ts:217](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/packages/holodeck/src/mock.ts#L217)

mock a DELETE request

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
