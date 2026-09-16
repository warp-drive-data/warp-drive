---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/legacy/model-fragments/variables/FragmentArrayExtension.md
---

&#x20;

# &#x20;FragmentArrayExtension

```ts
const FragmentArrayExtension: object;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/extensions/fragment-array.ts:95](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/legacy/src/model-fragments/extensions/fragment-array.ts#L95)

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
