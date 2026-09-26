---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/core/types/params/types/QueryParamsSerializationOptions.md
description: >-
  Options for query-string serialization, choosing how arrays are encoded:
  bracket, indices, repeat, or comma.
---

# &#x20;QueryParamsSerializationOptions

```ts
type QueryParamsSerializationOptions = {
  arrayFormat?: "bracket" | "indices" | "repeat" | "comma";
};
```

Defined in: [warp-drive-packages/core/src/types/params.ts:33](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/core/src/types/params.ts#L33)

Options for controlling how [QueryParamsSource](QueryParamsSource.md) values are
serialized into a URL query string.

## Properties

### arrayFormat?

```ts
optional arrayFormat?: "bracket" | "indices" | "repeat" | "comma";
```

Defined in: [warp-drive-packages/core/src/types/params.ts:42](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/core/src/types/params.ts#L42)

How array values should be serialized:

* `'bracket'` - `key[]=1&key[]=2`
* `'indices'` - `key[0]=1&key[1]=2`
* `'repeat'` - `key=1&key=2`
* `'comma'` - `key=1,2`
