---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/legacy/model/migration-support/functions/registerDerivations.md
---

&#x20;

# &#x20;registerDerivations()

```ts
function registerDerivations(schema): void;
```

Defined in: [warp-drive-packages/legacy/src/model/migration-support.ts:436](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/legacy/src/model/migration-support.ts#L436)

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
