---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/holodeck/mock/functions/DELETE.md
---

# &#x20;DELETE()

```ts
function DELETE(
   owner: object, 
   url: string, 
   response: ResponseGenerator, 
   options?: Partial<Omit<Scaffold, "response" | "url" | "method">> & {
  RECORD?: boolean;
}
): Promise<void>;
```

Defined in: [mock.ts:249](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/packages/holodeck/src/mock.ts#L249)

mock a DELETE request

## Parameters

### owner

`object`

### url

`string`

### response

[`ResponseGenerator`](../types/ResponseGenerator.md)

### options?

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)<[`Scaffold`](../types/Scaffold.md), `"response"` | `"url"` | `"method"`>> & {
`RECORD?`: `boolean`;
}

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
