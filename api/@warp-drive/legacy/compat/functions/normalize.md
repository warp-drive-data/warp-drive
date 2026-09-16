---
url: /api/@warp-drive/legacy/compat/functions/normalize.md
---

&#x20;

# &#x20;normalize()

```ts
function normalize(
   this, 
   modelName, 
   payload
): SingleResourceDocument;
```

Defined in: [warp-drive-packages/legacy/src/compat.ts:228](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/legacy/src/compat.ts#L228)

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

[`ObjectValue`](../../../core/types/json/raw/interfaces/ObjectValue.md)

## Returns

[`SingleResourceDocument`](../../../core/types/spec/json-api-raw/type-aliases/SingleResourceDocument.md)

The normalized payload
