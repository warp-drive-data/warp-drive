---
url: /pr-preview/pr-11087/api/@warp-drive/core/store/functions/parseCacheControl.md
---

# &#x20;parseCacheControl()

```ts
function parseCacheControl(header): CacheControlValue;
```

Defined in: [warp-drive-packages/core/src/store/-private/default-cache-policy.ts:127](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/store/-private/default-cache-policy.ts#L127)

Parses a string Cache-Control header value into an object with the following structure:

```ts
interface CacheControlValue {
  immutable?: boolean;
  'max-age'?: number;
  'must-revalidate'?: boolean;
  'must-understand'?: boolean;
  'no-cache'?: boolean;
  'no-store'?: boolean;
  'no-transform'?: boolean;
  'only-if-cached'?: boolean;
  private?: boolean;
  'proxy-revalidate'?: boolean;
  public?: boolean;
  's-maxage'?: number;
  'stale-if-error'?: number;
  'stale-while-revalidate'?: number;
}
```

See also [CacheControlValue](../interfaces/CacheControlValue.md) and [Response Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#response_directives)

## Parameters

### header

`string`

## Returns

[`CacheControlValue`](../interfaces/CacheControlValue.md)
