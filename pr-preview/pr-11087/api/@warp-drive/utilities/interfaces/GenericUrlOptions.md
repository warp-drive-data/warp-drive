---
url: /pr-preview/pr-11087/api/@warp-drive/utilities/interfaces/GenericUrlOptions.md
---

# &#x20;GenericUrlOptions

Defined in: [index.ts:396](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/utilities/src/index.ts#L396)

[buildBaseURL](../functions/buildBaseURL.md) options for building a URL directly from a `resourcePath`
without an associated request operation.

## Properties

### host?

```ts
optional host?: string;
```

Defined in: [index.ts:404](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/utilities/src/index.ts#L404)

Overrides the globally configured host for this call only.

***

### namespace?

```ts
optional namespace?: string;
```

Defined in: [index.ts:408](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/utilities/src/index.ts#L408)

Overrides the globally configured namespace for this call only.

***

### resourcePath

```ts
resourcePath: string;
```

Defined in: [index.ts:400](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/utilities/src/index.ts#L400)

The path segment for the resource.
