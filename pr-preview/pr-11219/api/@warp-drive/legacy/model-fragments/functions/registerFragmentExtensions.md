---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/legacy/model-fragments/functions/registerFragmentExtensions.md
---

&#x20;

# &#x20;registerFragmentExtensions()

```ts
function registerFragmentExtensions(schema: SchemaService): void;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts:15](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/legacy/src/model-fragments/instance-initializers/fragment-extensions.ts#L15)

Registers the [FragmentExtension](../variables/FragmentExtension.md)/[FragmentArrayExtension](../variables/FragmentArrayExtension.md) schema
extensions on the given `SchemaService`, enabling ModelFragments migration support.

## Parameters

### schema

`SchemaService`

## Returns

`void`
