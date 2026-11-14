---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/params/types/QueryParamsSerializationOptions.md
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

Defined in: [warp-drive-packages/core/src/types/params.ts:33](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/core/src/types/params.ts#L33)

Options for controlling how [QueryParamsSource](QueryParamsSource.md) values are
serialized into a URL query string.

## Properties

### arrayFormat?

```ts
arrayFormat?: "bracket" | "indices" | "repeat" | "comma";
```

Defined in: [warp-drive-packages/core/src/types/params.ts:42](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/core/src/types/params.ts#L42)

How array values should be serialized:

* `'bracket'` - `key[]=1&key[]=2`
* `'indices'` - `key[0]=1&key[1]=2`
* `'repeat'` - `key=1&key=2`
* `'comma'` - `key=1,2`
