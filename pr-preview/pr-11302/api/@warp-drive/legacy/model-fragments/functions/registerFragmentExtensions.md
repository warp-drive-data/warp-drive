---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/legacy/model-fragments/functions/registerFragmentExtensions.md
description: >-
  Legacy setup function that registers the fragment and fragment-array schema
  extensions on a `SchemaService` to support migrating off ModelFragments.
---

&#x20;

# &#x20;registerFragmentExtensions()

```ts
function registerFragmentExtensions(schema: SchemaService): void;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts:17](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts#L17)

Registers the [FragmentExtension](../variables/FragmentExtension.md)/[FragmentArrayExtension](../variables/FragmentArrayExtension.md) schema
extensions on the given `SchemaService`, enabling ModelFragments migration support.

## Parameters

### schema

`SchemaService`

## Returns

`void`
