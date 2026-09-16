---
url: /pr-preview/pr-11114/api/@warp-drive/utilities/json-api/functions/postQuery.md
---

# &#x20;postQuery()

## Call Signature

```ts
function postQuery<T, M, E>(
   type, 
   query?, 
   options?
): PostQueryRequestOptions<ReactiveDataDocument<T[], M, E>>;
```

Defined in: [-private/json-api/query.ts:153](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/utilities/src/-private/json-api/query.ts#L153)

Builds request options to query for resources, usually by a primary
type, configured for the url and header expectations of most JSON:API APIs.

The key difference between this and `query` is that this method will send the query
as the JSON body of a "POST" request instead of as query params in the url of a "GET"
request.

A CacheKey is generated from the url and query params, and used to cache the response
in the store.

```ts
import { postQuery } from '@warp-drive/utilities/json-api';

const options = postQuery('person', { include: ['pets', 'friends'] });
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
import { postQuery } from '@warp-drive/utilities/json-api';

const options = postQuery('person', { include: ['pets', 'friends'] }, { reload: true });
const data = await store.request(options);
```

### Type Parameters

#### T

`T`

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

the name of the resource type to query

#### query?

[`QueryParamsSource`](../../../core/types/params/type-aliases/QueryParamsSource.md)

the query params to send with the request

#### options?

`ConstrainedRequestOptions`

options to modify the request behavior

### Returns

`PostQueryRequestOptions`<`ReactiveDataDocument`<`T`\[], `M`, `E`>>

## Call Signature

```ts
function postQuery(
   type, 
   query?, 
   options?
): PostQueryRequestOptions;
```

Defined in: [-private/json-api/query.ts:158](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/utilities/src/-private/json-api/query.ts#L158)

Builds request options to query for resources, usually by a primary
type, configured for the url and header expectations of most JSON:API APIs.

The key difference between this and `query` is that this method will send the query
as the JSON body of a "POST" request instead of as query params in the url of a "GET"
request.

A CacheKey is generated from the url and query params, and used to cache the response
in the store.

```ts
import { postQuery } from '@warp-drive/utilities/json-api';

const options = postQuery('person', { include: ['pets', 'friends'] });
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
import { postQuery } from '@warp-drive/utilities/json-api';

const options = postQuery('person', { include: ['pets', 'friends'] }, { reload: true });
const data = await store.request(options);
```

### Parameters

#### type

`string`

the name of the resource type to query

#### query?

[`QueryParamsSource`](../../../core/types/params/type-aliases/QueryParamsSource.md)

the query params to send with the request

#### options?

`ConstrainedRequestOptions`

options to modify the request behavior

### Returns

`PostQueryRequestOptions`
