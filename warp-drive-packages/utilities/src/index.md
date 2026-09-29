# @warp-drive/utilities

Simple utility function to assist in url building,
query params, and other common request operations.

These primitives may be used directly or composed
by request builders to provide a consistent interface
for building requests.

For instance:

```ts
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

const baseURL = buildBaseURL({
  host: 'https://api.example.com',
  namespace: 'api/v1',
  resourcePath: 'emberDevelopers',
  op: 'query',
  identifier: { type: 'ember-developer' }
});
const url = `${baseURL}?${buildQueryParams({ name: 'Chris', include:['pets'] })}`;
// => 'https://api.example.com/api/v1/emberDevelopers?include=pets&name=Chris'
```

This is useful, but not as useful as the REST request builder for query which is sugar
over this (and more!):

```ts
import { query } from '@warp-drive/utilities/rest';

const options = query('ember-developer', { name: 'Chris', include:['pets'] });
// => { url: 'https://api.example.com/api/v1/emberDevelopers?include=pets&name=Chris' }
// Note: options will also include other request options like headers, method, etc.
```

## Guides

- [Installation](/guides/installation/#other-packages): install `@warp-drive/utilities` at the
  same version as `@warp-drive/core`.
- [Builders](/guides/the-manual/requests/builders.md): write request builders, and keep cache keys
  stable with `sortQueryParams`, `buildQueryParams` and `filterEmpty`.
- [Making Requests](/guides/the-manual/requests/): make a request with the `findRecord` builder,
  and the `AutoCompress` and `Gate` handlers.
- [Handlers](/guides/the-manual/requests/handlers.md): normalize a response with `dasherize` and
  `singularize` from `@warp-drive/utilities/string`.
- [Typing Requests](/guides/the-manual/requests/typing-requests.md): pass a response's meta type to
  the builders.
- [Basic Usage](/guides/the-manual/cookbook/basic-usage.md): configure `setBuildURLConfig` and
  page through results with the `query` builder.
- [Naming Conventions](/guides/the-manual/cookbook/naming-conventions.md): how `findRecord` turns a
  resource type into a URL path.
