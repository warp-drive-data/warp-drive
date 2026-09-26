---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/legacy/model-fragments/functions/registerFragmentExtensions.md
---

&#x20;

# &#x20;registerFragmentExtensions()

```ts
function registerFragmentExtensions(schema: SchemaService): void;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts:15](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts#L15)

Registers the [FragmentExtension](../variables/FragmentExtension.md)/[FragmentArrayExtension](../variables/FragmentArrayExtension.md) schema
extensions on the given `SchemaService`, enabling ModelFragments migration support.

## Parameters

### schema

`SchemaService`

## Returns

`void`
