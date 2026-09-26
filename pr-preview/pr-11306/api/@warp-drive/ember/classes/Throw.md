---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/ember/classes/Throw.md
description: >-
  Component that throws its `@error` argument when rendered, for templates that
  should fail if they reach that point.
---

# &#x20;Throw\<T>

Defined in: [warp-drive-packages/ember/dist/index.d.ts:329](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/ember/dist/index.d.ts#L329)

The `<Throw />` component is used to throw an error in a template.

That's all it does. So don't use it unless the application should
throw an error if it reaches this point in the template.

```gts
<Throw @error={{anError}} />
```

## Extends

* `default`<`ThrowSignature`<`T`>>

## Type Parameters

### T

`T`

## Constructors

### Constructor

```ts
new Throw<T>(owner: Owner, args: {
  error: T;
}): Throw<T>;
```

Defined in: [warp-drive-packages/ember/dist/index.d.ts:330](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/ember/dist/index.d.ts#L330)

#### Parameters

##### owner

`Owner`

##### args

###### error

`T`

#### Returns

`Throw`<`T`>

#### Overrides

```ts
Component<ThrowSignature<T>>.constructor
```
