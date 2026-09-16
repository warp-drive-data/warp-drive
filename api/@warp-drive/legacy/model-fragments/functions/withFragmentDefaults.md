---
url: /api/@warp-drive/legacy/model-fragments/functions/withFragmentDefaults.md
---

&#x20;

# &#x20;withFragmentDefaults()

```ts
function withFragmentDefaults<FragmentType, FragmentName>(fragmentType, fragmentName?): object;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/utilities/with-fragment-defaults.ts:9](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/legacy/src/model-fragments/utilities/with-fragment-defaults.ts#L9)

Used as a helper to setup the relevant parts of a fragment schema
and add extensions etc.

## Type Parameters

### FragmentType

`FragmentType` *extends* `string`

### FragmentName

`FragmentName` *extends* `string`

## Parameters

### fragmentType

`FragmentType`

The type of the fragment

### fragmentName?

`FragmentName`

The optional name of the fragment. If not provided, it will default to the fragmentType.

## Returns

The schema for a fragment

### kind

```ts
kind: "schema-object";
```

This field is a `'schema-object'` field, a single fragment.

### name

```ts
name: FragmentType | FragmentName;
```

The name of the fragment field.

### options

```ts
options: object;
```

The schema options for this fragment field.

#### options.objectExtensions

```ts
objectExtensions: string[];
```

The registered object-schema extensions to apply to this fragment.

### type

```ts
type: `fragment:${FragmentType}`;
```

The resource type of the fragment.
