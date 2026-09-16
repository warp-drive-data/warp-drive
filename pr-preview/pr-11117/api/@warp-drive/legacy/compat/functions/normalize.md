---
url: /pr-preview/pr-11117/api/@warp-drive/legacy/compat/functions/normalize.md
---

&#x20;

# &#x20;normalize()

```ts
function normalize(
   this: Store$1, 
   modelName: string, 
   payload: ObjectValue
): SingleResourceDocument;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:228](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/legacy/src/compat.ts#L228)

**`Legacy`**

`normalize` converts a json payload into the normalized form expected by
Store.push | push using the serializer specified by `modelName`

:::warning
Generally it would be better to invoke the serializer yourself directly,
or write a more specialized normalization utility.
:::

Example

```js
socket.on('message', function(message) {
  let modelName = message.model;
  let data = message.data;
  store.push(store.normalize(modelName, data));
});
```

## Parameters

### this

`Store$1`

### modelName

`string`

The name of the model type for this payload

### payload

[`ObjectValue`](../../../core/types/json/raw/types/ObjectValue.md)

## Returns

[`SingleResourceDocument`](../../../core/types/spec/json-api-raw/types/SingleResourceDocument.md)

The normalized payload
