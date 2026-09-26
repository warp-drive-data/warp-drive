---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/utilities/functions/setBuildURLConfig.md
description: >-
  Sets the app-wide default `host` and `namespace` used by `buildBaseURL` and
  the request builders.
---

# &#x20;setBuildURLConfig()

```ts
function setBuildURLConfig(config: BuildURLConfig): void;
```

Defined in: [index.ts:74](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/utilities/src/index.ts#L74)

Sets the global configuration for `buildBaseURL`
for host and namespace values for the application.

These values may still be overridden by passing
them to buildBaseURL directly.

This method may be called as many times as needed.
host values of `''` or `'/'` are equivalent.

Except for the value of `/` as host, host should not
end with `/`.

namespace should not start or end with a `/`.

```ts
type BuildURLConfig = {
  host: string;
  namespace: string'
}
```

Example:

```ts
import { setBuildURLConfig } from '@warp-drive/utilities';

setBuildURLConfig({
  host: 'https://api.example.com',
  namespace: 'api/v1'
});
```

## Parameters

### config

[`BuildURLConfig`](../types/BuildURLConfig.md)

## Returns

`void`
