# Write a Request Builder

Use this skill whenever you're about to write a request for `store.request` or a `<Request />`
component, add a builder, or change one. A builder is a function that returns a request object.
Together, an app's builders are its SDK for its API, so write each one as a documented, typed,
reusable entry point, not a one-off object.

## Steps

1. Check whether the app already has a builder for this request before writing one. Look in the
   app's builders directory or package, often `builders/` or `#/builders`. If one exists, call it
   instead of writing a second way to make the same request.
2. For a standard operation on a resource (`findRecord`, `query`, `createRecord`, `updateRecord`,
   `deleteRecord`), use or wrap the built-in builder for the app's API format:
   `@warp-drive/utilities/json-api`, `@warp-drive/utilities/rest`, or
   `@warp-drive/utilities/active-record`. If the app wraps these in its own builders, call the
   app's wrappers.
3. Otherwise write a new builder, one exported function per file, in the app's builders directory.
   Keeping builders in one place is what lets the rest of the app, and other apps, find and reuse
   them.
4. Name it for what it does, following the app's existing convention: `getCompanyPreviewList`,
   `searchUsers`, `createContentLike`. The name is how other code discovers the builder through
   autocomplete.
5. Give it a doc comment describing its contract: what the request is for, the endpoint and method,
   what each argument means, what comes back, paging and sorting, and which cached requests it
   invalidates (`cacheOptions.types`). Editors show this at every call site.
6. Set the response type inside the builder with `withReactiveResponse<T>()` or
   `withResponseType<T>()` from `@warp-drive/core/request`. Never add the type at the call site,
   by calling `withResponseType` there or casting the result with `as`: that is a cast, and a
   builder is the only way to type a request without one.
7. Keep it pure, and make it produce the same RequestKey for the same arguments. Build query
   strings with `buildQueryParams` from `@warp-drive/utilities`, not by hand. For a `POST` or
   other non-`GET` query, set `cacheOptions.key` from a stable serialization of the arguments.
   Without a stable key, identical requests are neither deduplicated nor cached.
8. At the call site, pass the builder's result straight to `store.request(...)` or `@query`. When
   several components need the same data, have each call the builder itself instead of loading it
   once and passing it down. Requests with a matching RequestKey share one response.

## Example

```ts
// builders/search-users.ts
import { withReactiveResponse } from '@warp-drive/core/request';
import { buildQueryParams } from '@warp-drive/utilities';
import type { UserPreview } from '#/data/types';

/**
 * Searches active users by name or email.
 *
 * - Endpoint: `GET /api/users`
 * - Returns at most 20 {@link UserPreview}s, sorted by name, ascending.
 *
 * @param term text matched against the user's name and email
 */
export function searchUsers(term: string) {
  const params = buildQueryParams({ search: term, sort: 'name', 'page[limit]': 20 });
  return withReactiveResponse<UserPreview[]>({ url: `/api/users?${params}` });
}
```

## Related

- Full guide: [Builders](/guides/the-manual/requests/builders.md)
- Typing: [Typing Requests](/guides/the-manual/requests/typing-requests.md)
- Making the request once the builder exists: [Fetch and Cache Data](./fetch-and-cache-data.md)
