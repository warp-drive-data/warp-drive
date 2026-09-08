# Typing Requests

Use [withResponseType](/api/@warp-drive/core/request/functions/withResponseType) to supply the response type.

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request'; // [!code focus]

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

const result = await store.request(
  withResponseType<ReactiveDataDocument<User>>({ // [!code focus:3]
    url: '/users/1'
  })
);

// [!code focus:2]
result.content.data.firstName; // will have type string
```

When using the component API, if the templating syntax does not allow typescript
generics, create a [builder](./builders.md) function.

```glimmer-ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request';

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

function getUser() { // [!code focus:5]
  return withResponseType<ReactiveDataDocument<User>>({
    url: '/users/1'
  });
}

export default <template>
  <Request @query={{(getUser)}}> <!-- [!code focus] -->
    <:content as |result|>
      <h1>Hello {{result.data.firstName}}!</h1>
    </:content>
  </Request>
</template>;
```

## Typing Reactive Responses

Requests that return reactive responses wrap the primary resource data in a [ReactiveDocument](/api/@warp-drive/core/reactive/type-aliases/ReactiveDocument). In the case of an error, this will be a [ReactiveErrorDocument](/api/@warp-drive/core/reactive/interfaces/ReactiveErrorDocument) and in the case of success it will be a [ReactiveDataDocument](/api/@warp-drive/core/reactive/interfaces/ReactiveDataDocument)

A conventient utility is available for [typing these reactive responses](/api/@warp-drive/core/request/functions/withReactiveResponse).

:::tabs key:return-type

== Lists

```ts
import { withReactiveResponse } from '@warp-drive/core/request';
import type { User } from '#/data/user';

function getUsers() {
  return withReactiveResponse<User[]>({
    url: '/users'
  })
);
```

== Single Resources

```ts
import { withReactiveResponse } from '@warp-drive/core/request';
import type { User } from '#/data/user';

function getUser(id) {
  return withReactiveResponse<User>({
    url: `/users/id`
  })
);
```

== Single Queries

```ts
import { withReactiveResponse } from '@warp-drive/core/request';
import type { User } from '#/data/user';

function getUser(id) {
  return  withReactiveResponse<User | null>({
    url: `/users/id`
  })
);
```

== Polymorphic Lists

```ts
import { withReactiveResponse } from '@warp-drive/core/request';
import type { User } from '#/data/user';
import type { Organization } from '#/data/user';

function getUsers() {
  return withReactiveResponse<Array<User | Organization>>({
    url: '/users'
  })
);
```

:::

The equivalent using `withResponseType` and `ReactiveDataDocument` is below.


:::tabs key:return-type

== Lists

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request';
import type { User } from '#/data/user';

function getUsers() {
  return withResponseType<ReactiveDataDocument<User[]>>({
    url: '/users'
  })
);
```

== Single Resources

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request';
import type { User } from '#/data/user';

function getUser(id) {
  return withResponseType<ReactiveDataDocument<User>>({
    url: `/users/id`
  })
);
```

== Single Queries

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request';
import type { User } from '#/data/user';

function getUser(id) {
  return withResponseType<ReactiveDataDocument<User | null>>({
    url: `/users/id`
  })
);
```

== Polymorphic Lists

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request';
import type { User } from '#/data/user';
import type { Organization } from '#/data/user';

function getUsers() {
  return withResponseType<ReactiveDataDocument<Array<User | Organization>>>({
    url: '/users'
  })
);
```

:::

## Typing the Document's `meta`

A reactive document also carries the response's [meta](https://jsonapi.org/format/#document-meta). By
default it is typed `Meta` — an arbitrary JSON object — so reading a key off it gives you `unknown`
and every callsite ends up coercing:

```ts
const { content } = await store.request(getUsers());

Number(content.meta?.total ?? 0); // meta.total is unknown
```

Both `ReactiveDataDocument` and `withReactiveResponse` take a second type param for the meta, so the
request declares once what its endpoint returns:

```ts
import { withReactiveResponse } from '@warp-drive/core/request';
import type { User } from '#/data/user';

type PageMeta = {
  page: { limit: number; offset: number };
  total?: number;
};

function getUsers() {
  return withReactiveResponse<User[], PageMeta>({
    url: '/users'
  });
}

const { content } = await store.request(getUsers());
content.meta?.total; // number | undefined
```

The param must be a `type` alias rather than an `interface`: `Meta` is an index-signature type, and
TypeScript gives implicit index signatures to aliases only, so an `interface` will not satisfy the
`M extends Meta` constraint.

The builders in `@warp-drive/utilities` take the same param, so a builder can declare its own meta
without hand-writing the document type:

```ts
import { query } from '@warp-drive/utilities/json-api';
import type { User } from '#/data/user';

const options = query<User, PageMeta>('user', { page: { limit: 10 } });
const { content } = await store.request(options);

content.meta?.page.limit; // number
```

`next`, `prev`, `first`, `last` and `fetch` carry the same meta type through to the document they
resolve with, since they hit the same endpoint.

## Typing Errors

The error variant of a document, [ReactiveErrorDocument](/api/@warp-drive/core/reactive/interfaces/ReactiveErrorDocument),
exposes `errors` as [ApiError](/api/@warp-drive/core/types/spec/error/interfaces/ApiError)`[]` — the
[{json:api} error object](https://jsonapi.org/format/#error-objects). Note that `status` is a string,
not a number, and every member is optional:

```ts
const { content } = await store.request(getUsers());

if (content.errors) {
  content.errors[0].status; // string | undefined
  content.errors[0].source?.pointer; // string | undefined
}
```

## How it works (for the curious)

`requestManager.request` and `store.request` each take a generic that can be used to set the return type of the content of the associated request.

```ts
interface Store {
  request<RT>(requestInit: RequestInfo<RT>): Future<RT>;
}
```

The `requestInit` param shares use of this generic, and its `RequestInfo`
type assigns its generic own arg to a special brand:

```ts
interface RequestInfo<RT> {
  [RequestSignature]: RT;
}
```

What this means is that any `requestInfo` param using this brand in its type
will enable the request method to infer the attached response signature due
to the shared generic. `withResponseType` adds this brand into your
object's type in a convenient way.

## Why This Approach?

Typing the response to a network request is inherently frail. Even in the best designed, integrated and tested systems the contract may drift.

By using a simple generic to enable providing the response type, we provide maximum
flexibility for apps to choose their own level of safety.

You might handroll types, or you might have intelligent tooling that constructs the type from the request (like GraphQL), or even tooling that compiles the type from your API specs. Perhaps you love libraries like ArkType, Valibot, or Zod.

Each of these comes with its own tradeoffs, but each can be made to provide this generic quite easily. Instead of selecting a tradeoff you probably would hate, we
have left that choice for you. This said, we recommend starting with builders and then exploring more advanced setups only if you still need once you've gotten your feet wet.
