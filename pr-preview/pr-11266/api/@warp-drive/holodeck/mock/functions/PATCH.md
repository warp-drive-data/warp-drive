---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/holodeck/mock/functions/PATCH.md
---

# &#x20;PATCH()

```ts
function PATCH(
   owner: object, 
   url: string, 
   response: ResponseGenerator, 
   options?: Partial<Omit<Scaffold, "response" | "url" | "method">> & {
  RECORD?: boolean;
}
): Promise<void>;
```

Defined in: [mock.ts:217](https://github.com/warp-drive-data/warp-drive/blob/1a7c85f0c565d334929c0f2dd26023bb9bbcb6f7/packages/holodeck/src/mock.ts#L217)

mock a PATCH request

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
