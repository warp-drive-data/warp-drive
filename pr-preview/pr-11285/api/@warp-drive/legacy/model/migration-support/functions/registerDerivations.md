---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/legacy/model/migration-support/functions/registerDerivations.md
---

&#x20;

# &#x20;registerDerivations()

```ts
function registerDerivations(schema: SchemaService): void;
```

Defined in: [warp-drive-packages/legacy/src/model/migration-support.ts:436](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/warp-drive-packages/legacy/src/model/migration-support.ts#L436)

A function which registers the necessary derivations to support
the LegacyMode features of @warp-drive/legacy/model while migrating to WarpDrive.

This must be called in order to use the fields added by [withDefaults](withDefaults.md) or
[withRestoredDeprecatedModelRequestBehaviors](withRestoredDeprecatedModelRequestBehaviors.md).

## Parameters

### schema

`SchemaService`

The schema service to register the derivations with.

## Returns

`void`
