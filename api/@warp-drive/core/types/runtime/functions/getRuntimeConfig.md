---
url: /api/@warp-drive/core/types/runtime/functions/getRuntimeConfig.md
---

# &#x20;getRuntimeConfig()

```ts
function getRuntimeConfig(): object;
```

Defined in: [warp-drive-packages/core/src/types/runtime.ts:52](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/runtime.ts#L52)

Returns the current WarpDrive runtime configuration.

## Returns

### debug

```ts
debug: Partial<LOG_CONFIG>;
```

the currently active logging configuration, see
[the debugging flags](../../../build-config/debugging/index.md)

### mirage?

```ts
optional mirage?: boolean;
```

whether requests should be treated as being served by Mirage,
see [setIsMaybeMirage](setIsMaybeMirage.md)

## Example

```ts
const { debug, mirage } = getRuntimeConfig();
```
