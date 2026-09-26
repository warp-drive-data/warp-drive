---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/schema-dsl/types/ObjectFieldOptions.md
---

# &#x20;ObjectFieldOptions

```ts
interface ObjectFieldOptions {
  sourceKey?: string;
  type?: string;
}
```

Defined in: [fields/object.ts:11](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/schema-dsl/src/fields/object.ts#L11)

Options accepted by the [object](../functions/object.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/object.ts:19](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/schema-dsl/src/fields/object.ts#L19)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the [ObjectField](../../core/types/schema/fields/types/ObjectField.md)'s
`sourceKey`.

***

### type?

```ts
optional type?: string;
```

Defined in: [fields/object.ts:28](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/schema-dsl/src/fields/object.ts#L28)

The name of a [Transformation](../../core/types/schema/concepts/types/Transformation.md) to pass the entire object through
before displaying or serializing it. Compiles onto the
[ObjectField](../../core/types/schema/fields/types/ObjectField.md)'s `type`.
