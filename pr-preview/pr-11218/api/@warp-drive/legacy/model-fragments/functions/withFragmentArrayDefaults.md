---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/legacy/model-fragments/functions/withFragmentArrayDefaults.md
---

&#x20;

# &#x20;withFragmentArrayDefaults()

```ts
function withFragmentArrayDefaults<FragmentArrayType extends string, FragmentArrayName extends string>(fragmentArrayType: FragmentArrayType, fragmentArrayName?: FragmentArrayName): {
  kind: "schema-array";
  name: string;
  options: {
     arrayExtensions: string[];
     defaultValue: boolean;
  };
  type: `fragment:${string}`;
};
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/utilities/with-fragment-array-defaults.ts:11](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/legacy/src/model-fragments/utilities/with-fragment-array-defaults.ts#L11)

Used as a helper to setup the relevant parts of a fragment-array
schema and add extensions etc.

## Type Parameters

### FragmentArrayType

`FragmentArrayType` *extends* `string`

### FragmentArrayName

`FragmentArrayName` *extends* `string`

## Parameters

### fragmentArrayType

`FragmentArrayType`

The type of the fragment-array

### fragmentArrayName?

`FragmentArrayName`

The name of the fragment-array

## Returns

The schema for a fragment-array

### kind

```ts
kind: "schema-array";
```

This field is a `'schema-array'` field, an array of fragments.

### name

```ts
name: string;
```

The name of the fragment-array field.

### options

```ts
options: {
  arrayExtensions: string[];
  defaultValue: boolean;
};
```

The schema options for this fragment-array field.

#### options.arrayExtensions

```ts
arrayExtensions: string[];
```

The registered array-schema extensions to apply to this array.

#### options.defaultValue

```ts
defaultValue: boolean;
```

Whether the array defaults to a non-null empty array when unset.

### type

```ts
type: `fragment:${string}`;
```

The resource type of the fragments contained in this array.
