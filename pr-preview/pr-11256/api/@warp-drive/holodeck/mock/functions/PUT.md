---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/holodeck/mock/functions/PUT.md
---

# &#x20;PUT()

```ts
function PUT(
   owner: object, 
   url: string, 
   response: ResponseGenerator, 
   options?: Partial<Omit<Scaffold, "response" | "url" | "method">> & {
  RECORD?: boolean;
}
): Promise<void>;
```

Defined in: [mock.ts:184](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/packages/holodeck/src/mock.ts#L184)

mock a PUT request

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
