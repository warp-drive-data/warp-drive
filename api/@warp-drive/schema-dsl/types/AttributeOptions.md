---
url: /api/@warp-drive/schema-dsl/types/AttributeOptions.md
---

# &#x20;AttributeOptions

```ts
interface AttributeOptions {
  sourceKey?: string;
  type?: string;
}
```

Defined in: [fields/attribute.ts:10](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/schema-dsl/src/fields/attribute.ts#L10)

Options accepted by the [attribute](../functions/attribute.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/attribute.ts:18](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/schema-dsl/src/fields/attribute.ts#L18)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the
[LegacyAttributeField](../../core/types/schema/fields/types/LegacyAttributeField.md)'s `sourceKey`.

***

### type?

```ts
optional type?: string;
```

Defined in: [fields/attribute.ts:25](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/schema-dsl/src/fields/attribute.ts#L25)

The name of a legacy transform to compile onto the field's `type`.
