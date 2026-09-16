---
url: /pr-preview/pr-11111/api/@warp-drive/utilities/json-api/functions/query.md
---

# &#x20;query()

## Call Signature

```ts
function query<T, M, E>(
   type, 
   query?, 
   options?
): QueryRequestOptions<ReactiveDataDocument<T[], M, E>>;
```

Defined in: [-private/json-api/query.ts:66](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/-private/json-api/query.ts#L66)

Builds request options to query for resources, usually by a primary
type, configured for the url and header expectations of most JSON:API APIs.

The key difference between this and `postQuery` is that this method will send the query
as query params in the url of a "GET" request instead of as the JSON body of a "POST"
request.

**Basic Usage**

```ts
import { query } from '@warp-drive/utilities/json-api';

const data = await store.request(query('person'));
```

**With Query Params**

```ts
import { query } from '@warp-drive/utilities/json-api';

const options = query('person', { include: ['pets', 'friends'] });
const data = await store.request(options);
```

**Supplying Options to Modify the Request Behavior**

The following options are supported:

* `host` - The host to use for the request, defaults to the `host` configured with `setBuildURLConfig`.
* `namespace` - The namespace to use for the request, defaults to the `namespace` configured with `setBuildURLConfig`.
* `resourcePath` - The resource path to use for the request, defaults to pluralizing the supplied type
* `reload` - Whether to forcibly reload the request if it is already in the store, not supplying this
  option will delegate to the store's CachePolicy, defaulting to `false` if none is configured.
* `backgroundReload` - Whether to reload the request if it is already in the store, but to also resolve the
  promise with the cached value, not supplying this option will delegate to the store's CachePolicy,
  defaulting to `false` if none is configured.
* `urlParamsSetting` - an object containing options for how to serialize the query params (see `buildQueryParams`)

```ts
import { query } from '@warp-drive/utilities/json-api';

const options = query('person', { include: ['pets', 'friends'] }, { reload: true });
const data = await store.request(options);
```

### Type Parameters

#### T

`T` *extends* [`TypedRecordInstance`](../../../core/types/record/interfaces/TypedRecordInstance.md)

#### M

`M` *extends*
| [`ObjectValue`](../../../core/types/json/raw/interfaces/ObjectValue.md)
| `undefined` =
| [`ObjectValue`](../../../core/types/json/raw/interfaces/ObjectValue.md)
| `undefined`

#### E

`E` *extends* `object` = [`ApiError`](../../../core/types/spec/error/interfaces/ApiError.md)

### Parameters

#### type

[`TypeFromInstance`](../../../core/types/record/type-aliases/TypeFromInstance.md)<`T`>

#### query?

[`QueryParamsSource`](../../../core/types/params/type-aliases/QueryParamsSource.md)

#### options?

`ConstrainedRequestOptions`

### Returns

`QueryRequestOptions`<`ReactiveDataDocument`<`T`\[], `M`, `E`>>

## Call Signature

```ts
function query(
   type, 
   query?, 
   options?
): QueryRequestOptions;
```

Defined in: [-private/json-api/query.ts:75](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/-private/json-api/query.ts#L75)

Builds request options to query for resources, usually by a primary
type, configured for the url and header expectations of most JSON:API APIs.

The key difference between this and `postQuery` is that this method will send the query
as query params in the url of a "GET" request instead of as the JSON body of a "POST"
request.

**Basic Usage**

```ts
import { query } from '@warp-drive/utilities/json-api';

const data = await store.request(query('person'));
```

**With Query Params**

```ts
import { query } from '@warp-drive/utilities/json-api';

const options = query('person', { include: ['pets', 'friends'] });
const data = await store.request(options);
```

**Supplying Options to Modify the Request Behavior**

The following options are supported:

* `host` - The host to use for the request, defaults to the `host` configured with `setBuildURLConfig`.
* `namespace` - The namespace to use for the request, defaults to the `namespace` configured with `setBuildURLConfig`.
* `resourcePath` - The resource path to use for the request, defaults to pluralizing the supplied type
* `reload` - Whether to forcibly reload the request if it is already in the store, not supplying this
  option will delegate to the store's CachePolicy, defaulting to `false` if none is configured.
* `backgroundReload` - Whether to reload the request if it is already in the store, but to also resolve the
  promise with the cached value, not supplying this option will delegate to the store's CachePolicy,
  defaulting to `false` if none is configured.
* `urlParamsSetting` - an object containing options for how to serialize the query params (see `buildQueryParams`)

```ts
import { query } from '@warp-drive/utilities/json-api';

const options = query('person', { include: ['pets', 'friends'] }, { reload: true });
const data = await store.request(options);
```

### Parameters

#### type

`string`

#### query?

[`QueryParamsSource`](../../../core/types/params/type-aliases/QueryParamsSource.md)

#### options?

`ConstrainedRequestOptions`

### Returns

`QueryRequestOptions`
