---
url: /api/@warp-drive/ember/index/classes/Throw.md
---

# &#x20;Throw\<T>

Defined in: [warp-drive-packages/ember/dist/index.d.ts:321](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/ember/dist/index.d.ts#L321)

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
new Throw<T>(owner, args): Throw<T>;
```

Defined in: [warp-drive-packages/ember/dist/index.d.ts:322](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/ember/dist/index.d.ts#L322)

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
