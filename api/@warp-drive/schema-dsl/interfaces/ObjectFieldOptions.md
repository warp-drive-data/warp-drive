---
url: /api/@warp-drive/schema-dsl/interfaces/ObjectFieldOptions.md
---

# &#x20;ObjectFieldOptions

Defined in: [fields/object.ts:11](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/schema-dsl/src/fields/object.ts#L11)

Options accepted by the [object](../functions/object.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/object.ts:19](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/schema-dsl/src/fields/object.ts#L19)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the [ObjectField](../../core/types/schema/fields/interfaces/ObjectField.md)'s
`sourceKey`.

***

### type?

```ts
optional type?: string;
```

Defined in: [fields/object.ts:28](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/schema-dsl/src/fields/object.ts#L28)

The name of a [Transformation](../../core/types/schema/concepts/type-aliases/Transformation.md) to pass the entire object through
before displaying or serializing it. Compiles onto the
[ObjectField](../../core/types/schema/fields/interfaces/ObjectField.md)'s `type`.
