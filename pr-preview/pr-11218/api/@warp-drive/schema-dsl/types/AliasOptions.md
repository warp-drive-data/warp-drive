---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/schema-dsl/types/AliasOptions.md
---

# &#x20;AliasOptions

```ts
interface AliasOptions {
  kind: string;
  name: string;
  sourceKey?: string;
  type?: string;
}
```

Defined in: [fields/alias.ts:12](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/alias.ts#L12)

Options accepted by the [alias](../functions/alias.md) decorator, describing the field
being aliased.

## Properties

### kind

```ts
kind: string;
```

Defined in: [fields/alias.ts:19](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/alias.ts#L19)

The `kind` of the field being aliased, e.g. `'field'`, `'object'`, or
`'array'`.

***

### name

```ts
name: string;
```

Defined in: [fields/alias.ts:26](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/alias.ts#L26)

The `name` of the field being aliased.

***

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/alias.ts:40](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/alias.ts#L40)

The `sourceKey` of the field being aliased, if it differs from `name`.

***

### type?

```ts
optional type?: string;
```

Defined in: [fields/alias.ts:33](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/alias.ts#L33)

The name of a [Transformation](../../core/types/schema/concepts/types/Transformation.md) associated with the aliased field.
