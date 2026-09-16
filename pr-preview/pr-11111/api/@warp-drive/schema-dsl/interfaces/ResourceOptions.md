---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/interfaces/ResourceOptions.md
---

# &#x20;ResourceOptions

Defined in: [entities/resource.ts:17](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/entities/resource.ts#L17)

Options accepted by the [Resource](../functions/Resource.md) decorator.

## Properties

### identityField?

```ts
optional identityField?: string;
```

Defined in: [entities/resource.ts:39](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/entities/resource.ts#L39)

The name of the property that serves as this resource's primary key,
used only when no property on the class is decorated with [id](../functions/id.md).

Compiles to `identity: { kind: '@id', name: identityField }`. When
omitted (and no [id](../functions/id.md) is present), the identity defaults to
`{ kind: '@id', name: 'id' }`.

***

### legacy?

```ts
optional legacy?: boolean;
```

Defined in: [entities/resource.ts:27](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/entities/resource.ts#L27)

Compiles the class to a [LegacyResourceSchema](../../core/types/schema/fields/interfaces/LegacyResourceSchema.md) for use with
`@warp-drive/legacy/model` instead of a [PolarisResourceSchema](../../core/types/schema/fields/interfaces/PolarisResourceSchema.md).

Legacy resources omit the `$type` and `constructor` [DerivedField](../../core/types/schema/fields/interfaces/DerivedField.md)s
that [Resource](../functions/Resource.md) otherwise adds automatically.
