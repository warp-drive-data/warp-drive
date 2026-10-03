---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/legacy/model-fragments/functions/registerFragmentExtensions.md
description: >-
  Legacy setup function that registers the fragment and fragment-array schema
  extensions on a `SchemaService` to support migrating off ModelFragments.
---

&#x20;

# &#x20;registerFragmentExtensions()

```ts
function registerFragmentExtensions(schema: SchemaService): void;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts:17](https://github.com/warp-drive-data/warp-drive/blob/c095d2e6f55c70ee964e1a33fb501af9507bd094/warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts#L17)

Registers the [FragmentExtension](../variables/FragmentExtension.md)/[FragmentArrayExtension](../variables/FragmentArrayExtension.md) schema
extensions on the given `SchemaService`, enabling ModelFragments migration support.

## Parameters

### schema

`SchemaService`

## Returns

`void`
