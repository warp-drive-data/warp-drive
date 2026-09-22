---
title: Writing Mocks
---

# Writing mocks

A mock tells the holodeck server what to answer for one request in one test. Declare it in the
test, before the code under test makes the request.

## Declare a mock

Import the helper for the HTTP method you need from `@warp-drive/holodeck/mock`. There is one for
`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `HEAD`, and they all take the same four arguments.

```ts
import { GET } from '@warp-drive/holodeck/mock';

test('it renders a user', async function (assert) {
  await GET(this, 'users/1', () => ({
    data: { id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } },
  }));

  const { content } = await store.request(findRecord('user', '1'));
  assert.strictEqual(content.data.name, 'Chris Thoburn');
});
```

The first argument is the test context. Pass `this` from inside a `function` test body, never an
arrow function, because holodeck looks the test up by object identity. The same object has to reach
`setTestId`, the `MockServerHandler` constructor, and every mock helper. See
[Test framework integration](./test-framework-integration.md) and
[Client setup](./client-setup.md) for where the first two happen.

The second argument is the URL to match, relative to the mock host and without a leading slash.

The third argument is a function returning the response payload. Holodeck calls it only while
recording.

The fourth argument is optional and holds everything else the server should send back.

## Set the status and headers

Pass `status`, `statusText`, and `headers` in the options object to control the response.

```ts
await GET(this, 'users/1', () => ({
  errors: [{ status: '404', title: 'Not Found' }],
}), { status: 404 });
```

`statusText` is filled in from the status code when you leave it out, so a `status: 404` mock
responds with `Not Found` on its own.

`Content-Type` defaults to `application/vnd.api+json`. Override it through `headers` when you mock
something that is not JSON:API.

When you leave `status` out, the helper picks one.

| Helper | Status when the response is empty | Status when it has a body |
| --- | --- | --- |
| `GET`, `HEAD` | `200` | `200` |
| `POST` | `204` | `201` |
| `PUT`, `PATCH`, `DELETE` | `204` | `200` |

## Match a request that has a body

For a mutation, holodeck matches on the request body as well as the URL. The `body` option holds
the body to match, and it has to be the exact string the request sends.

This is the part that trips people up. Holodeck hashes `JSON.stringify(body)` on both sides and
compares the hashes. On replay its side of that comparison is the raw request text, so an object
and the JSON string of that object produce different hashes and the mock never matches. Key order
counts for the same reason.

Build the string once and use it for both.

```ts
const reqBody = JSON.stringify({
  data: { type: 'user', id: '1', attributes: { name: 'Chris' } },
});

await PATCH(this, 'users/1', () => ({
  data: { id: '1', type: 'user', attributes: { name: 'Chris' } },
}), { body: reqBody });

await store.request({ url, method: 'PATCH', body: reqBody });
```

A correctly recorded body-matched mock stores an escaped string in its `.meta.json`.

```json
"requestBody": "{\"data\":{\"type\":\"user\",\"attributes\":{\"name\":\"Chris\"}}}"
```

An object there instead means the mock was given an object literal, and that fixture will never be
replayed.

## Mock the same URL more than once

Holodeck counts requests per method and URL within a test. The first mock for `GET users/1` answers
the first `GET users/1` the test makes, the second answers the second, and so on.

Declare the mocks in the order the requests happen. Two mocks for one URL in the wrong order
produce two mismatched responses, not an error.

## Write the URL the way the server will see it

Holodeck matches the URL as text, so a query string has to be written exactly as the browser sends
it. The server reads the query through `URLSearchParams`, which percent-encodes anything outside
the unreserved set.

Square brackets are the common case, because JSON:API filters use them.

```ts
// Does not match. The request arrives as users?filter%5Bname%5D=Chris
await GET(this, 'users?filter[name]=Chris', () => ({ data: [] }));

// Matches.
await GET(this, 'users?filter%5Bname%5D=Chris', () => ({ data: [] }));
```

Parameter order matters too. `users?a=1&b=2` and `users?b=2&a=1` are two different mocks.

## Mock a request that goes through a legacy adapter

The mock helpers work the same way, but the request needs a route into holodeck first, because
legacy adapters bypass the request chain. See
[Client setup](./client-setup.md#with-legacy-adapters).

## Build a scaffold by hand

The six helpers are wrappers around `mock`, which takes the whole scaffold at once. Reach for it
when you need a method the helpers do not cover.

```ts
import { mock } from '@warp-drive/holodeck';

await mock(this, () => ({
  url: 'users/1',
  method: 'OPTIONS',
  status: 204,
  headers: {},
  body: null,
  response: {},
}));
```

The server's CORS configuration allows `GET`, `HEAD`, `PUT`, `POST`, `DELETE`, and `PATCH` only, so
a custom method has to survive the browser's own cross-origin rules before holodeck sees it.

## Related

- [Recording and replaying](./record-and-replay.md) covers what happens to these mocks on disk.
- [Troubleshooting](./troubleshooting.md) covers the errors a mismatched mock produces.
