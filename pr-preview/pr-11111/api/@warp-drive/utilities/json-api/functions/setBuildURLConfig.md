---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/utilities/json-api/functions/setBuildURLConfig.md
---

# &#x20;setBuildURLConfig()

```ts
function setBuildURLConfig(config): void;
```

Defined in: [-private/json-api/-utils.ts:61](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/utilities/src/-private/json-api/-utils.ts#L61)

Allows setting extensions and profiles to be used in the `Accept` header.

Extensions and profiles are keyed by their namespace with the value being
their URI.

Example:

```ts
setBuildURLConfig({
  extensions: {
    atomic: 'https://jsonapi.org/ext/atomic'
  },
  profiles: {
    pagination: 'https://jsonapi.org/profiles/ethanresnick/cursor-pagination'
  }
});
```

This also sets the global configuration for `buildBaseURL`
for host and namespace values for the global coniguration
done via `import { setBuildURLConfig } from '@warp-drive/utilities';`

These values may still be overridden by passing
them to buildBaseURL directly.

This method may be called as many times as needed

```ts
type BuildURLConfig = {
  host: string;
  namespace: string'
}
```

## Parameters

### config

`JSONAPIConfig`

## Returns

`void`
