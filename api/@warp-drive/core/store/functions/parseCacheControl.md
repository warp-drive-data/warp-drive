---
url: /api/@warp-drive/core/store/functions/parseCacheControl.md
---

# &#x20;parseCacheControl()

```ts
function parseCacheControl(header): CacheControlValue;
```

Defined in: [warp-drive-packages/core/src/store/-private/default-cache-policy.ts:127](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/core/src/store/-private/default-cache-policy.ts#L127)

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

See also [CacheControlValue](../types/CacheControlValue.md) and [Response Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#response_directives)

## Parameters

### header

`string`

## Returns

[`CacheControlValue`](../types/CacheControlValue.md)
