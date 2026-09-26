---
url: /api/@warp-drive/core/types/request/interfaces/FindRecordOptions.md
---

# &#x20;FindRecordOptions

Defined in: [warp-drive-packages/core/src/types/request.ts:432](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L432)

Options accepted by the `findRecord` request builders.

## Extends

* [`ConstrainedRequestOptions`](ConstrainedRequestOptions.md)

## Properties

### backgroundReload?

```ts
optional backgroundReload?: boolean;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:407](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L407)

If true, and a cached response is present and not expired, the request
will be made in the background and the cached response will be returned.

#### Inherited from

[`ConstrainedRequestOptions`](ConstrainedRequestOptions.md).[`backgroundReload`](ConstrainedRequestOptions.md#backgroundreload)

***

### host?

```ts
optional host?: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:412](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L412)

The host to use when constructing the request's url, overriding any
host configured via `setBuildURLConfig`.

#### Inherited from

[`ConstrainedRequestOptions`](ConstrainedRequestOptions.md).[`host`](ConstrainedRequestOptions.md#host)

***

### include?

```ts
optional include?: string | string[];
```

Defined in: [warp-drive-packages/core/src/types/request.ts:436](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L436)

the relationship paths to sideload, see [Includes](../../record/type-aliases/Includes.md)

***

### namespace?

```ts
optional namespace?: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:417](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L417)

The namespace to use when constructing the request's url, overriding
any namespace configured via `setBuildURLConfig`.

#### Inherited from

[`ConstrainedRequestOptions`](ConstrainedRequestOptions.md).[`namespace`](ConstrainedRequestOptions.md#namespace)

***

### reload?

```ts
optional reload?: boolean;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:402](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L402)

If true, the request will be made even if a cached response is present
and not expired.

#### Inherited from

[`ConstrainedRequestOptions`](ConstrainedRequestOptions.md).[`reload`](ConstrainedRequestOptions.md#reload)

***

### resourcePath?

```ts
optional resourcePath?: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:422](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L422)

The resource path to use when constructing the request's url,
overriding the default of pluralizing the resource's type.

#### Inherited from

[`ConstrainedRequestOptions`](ConstrainedRequestOptions.md).[`resourcePath`](ConstrainedRequestOptions.md#resourcepath)

***

### urlParamsSettings?

```ts
optional urlParamsSettings?: QueryParamsSerializationOptions;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:426](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/request.ts#L426)

Options for how to serialize the request's query params, see [QueryParamsSerializationOptions](../../params/type-aliases/QueryParamsSerializationOptions.md).

#### Inherited from

[`ConstrainedRequestOptions`](ConstrainedRequestOptions.md).[`urlParamsSettings`](ConstrainedRequestOptions.md#urlparamssettings)
