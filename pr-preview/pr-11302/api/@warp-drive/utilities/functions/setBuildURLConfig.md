---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/utilities/functions/setBuildURLConfig.md
description: >-
  Sets the app-wide default `host` and `namespace` used by `buildBaseURL` and
  the request builders.
---

# &#x20;setBuildURLConfig()

```ts
function setBuildURLConfig(config: BuildURLConfig): void;
```

Defined in: [index.ts:74](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/utilities/src/index.ts#L74)

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
