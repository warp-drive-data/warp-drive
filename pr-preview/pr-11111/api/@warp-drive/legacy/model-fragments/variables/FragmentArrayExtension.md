---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/legacy/model-fragments/variables/FragmentArrayExtension.md
---

&#x20;

# &#x20;FragmentArrayExtension

```ts
const FragmentArrayExtension: object;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/extensions/fragment-array.ts:95](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/legacy/src/model-fragments/extensions/fragment-array.ts#L95)

A schema extension that adds the [FragmentArray](../classes/FragmentArray.md) API to migrated
`ModelFragments` array resources.

## Type Declaration

### features

```ts
features: typeof FragmentArray;
```

The features ([FragmentArray](../classes/FragmentArray.md)) added by this extension.

### kind

```ts
kind: "array";
```

This extension applies to `'array'` schemas.

### name

```ts
name: "fragment-array";
```

The registered name of this extension.
