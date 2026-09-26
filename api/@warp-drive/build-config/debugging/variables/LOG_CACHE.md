---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/debugging/variables/LOG_CACHE.md
description: >-
  Debug logging flag that logs cache updates to both local and remote state; it
  replaces `LOG_PAYLOADS`, `LOG_OPERATIONS`, and `LOG_MUTATIONS`.
---

# &#x20;LOG\_CACHE&#x20;

```ts
const LOG_CACHE: boolean = false;
```

Defined in: [debugging.ts:25](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/build-config/src/debugging.ts#L25)

log cache updates for both local
and remote state. Note in some older versions
this was called `LOG_PAYLOADS` and was one
of three flags that controlled logging of
cache updates. This is now the only flag.

The others were `LOG_OPERATIONS` and `LOG_MUTATIONS`.
