---
url: https://canary.warp-drive.io/pr-preview/pr-11305/api/@ember-data/store.md
description: >-
  (Legacy) EmberData `Store` class that coordinates the cache, the
  `RequestManager` and record presentation; new apps should use the `Store` from
  `@warp-drive/core` instead.
---

&#x20;

:::warning Legacy package
`@ember-data/store` is a legacy package. New code should use [`@warp-drive/core`](/api/@warp-drive/core/) instead.
:::

This package provides [*Ember***Data**](https://github.com/warp-drive-data/warp-drive/)'s `Store` class.

A [Store](../../@warp-drive/core/classes/Store.md) coordinates interaction between your application, a [Cache](/api/@warp-drive/core/types/cache/types/Cache),
and sources of data (such as your API or a local persistence layer) accessed via a [RequestManager](../../@warp-drive/core/classes/RequestManager.md).
Optionally, a Store can be configured to hydrate the response data into rich presentation classes.
[How the Pieces Connect](/api/@warp-drive/core/#how-the-pieces-connect) diagrams both.

## Creating A Store

To use a `Store` we will need to do a few things: add a [Cache](/api/@warp-drive/core/types/cache/types/Cache)
to store data **in-memory**, add a [Handler](/api/@warp-drive/core/request/types/Handler) to fetch data from a source,
and implement `instantiateRecord` to tell the store how to display the data for individual resources.

:::tip Note
If you are using the package `ember-data` then a JSON:API cache, RequestManager, LegacyNetworkHandler,
and `instantiateRecord` are configured for you by default.
:::

### Configuring A Cache

To start, let's install a [{json:api}](https://jsonapi.org/) cache. If your app uses `GraphQL` or `REST` other
caches may better fit your data. You can author your own cache by creating one that
conforms to the [spec](/api/@warp-drive/core/types/cache/types/Cache).

The package `@ember-data/json-api` provides a [{json:api}](https://jsonapi.org/) cache we can use.
After installing it, we can configure the store to use this cache.

```js
import Store from '@ember-data/store';
import Cache from '@ember-data/json-api';

export default class extends Store {
  createCache(capabilities) {
    return new Cache(capabilities);
  }
}
```

Now that we have a `cache` let's setup something to handle fetching
and saving data via our API.

:::tip Note
The `ember-data` package automatically includes and configures
the `@ember-data/json-api` cache for you.
:::

### Handling Requests

When *Ember***Data** needs to fetch or save data it will pass that request to your application's `RequestManager` for fulfillment. How this fulfillment occurs (in-memory, device storage, via single or multiple API requests, etc.) is then up to the registered request handlers.

To start, let's install the `RequestManager` from `@ember-data/request` and the basic `Fetch` handler from `@ember-data/request/fetch`.

:::tip Note
If your app uses `GraphQL`, `REST` or different conventions for `JSON:API` than your cache expects, other handlers may better fit your data. You can author your own handler by creating one that conforms to the [handler interface](/api/@warp-drive/core/request/types/Handler).
:::

```ts
import Store from '@ember-data/store';
import RequestManager from '@ember-data/request';
import Fetch from '@ember-data/request/fetch';

export default class extends Store {
  requestManager = new RequestManager()
    .use([Fetch])
    .useCache(CacheHandler);
}
```

### Using RequestManager as a Service

Alternatively if you have configured the `RequestManager` to be a service you may re-use it.

*app/services/request.js*

```ts
import RequestManager from '@ember-data/request';
import Fetch from '@ember-data/request/fetch';
import { CacheHandler } from '@ember-data/store';

export default {
  create() {
    return new RequestManager()
      .use([Fetch])
      .useCache(CacheHandler);
  }
}
```

*app/services/store.js*

```ts
import Store from '@ember-data/store';
import { service } from '@ember/service';

export default class extends Store {
  @service('request') requestManager
}
```

### Presenting Data from the Cache

Now that we have a source and a cache for our data, we need to configure how
the Store delivers that data back to our application. We do this via the [instantiateRecord hook](../../@warp-drive/core/classes/Store.md#instantiaterecord)
which allows us to transform the data for a resource before handing it to the application.

A naive way to present the data would be to return it as JSON. Typically instead
this hook will be used to add reactivity and make each unique resource a singleton,
ensuring that if the cache updates our presented data will reflect the new state.

Below is an example of using the hooks `instantiateRecord` and a `teardownRecord`
to provide minimal read-only reactive state for simple resources.

```ts
import Store from '@ember-data/store';
import { TrackedObject } from 'tracked-built-ins';

export default class extends Store {
  instantiateRecord(identifier) {
    const { cache, notifications } = this;

    // create a TrackedObject with our attributes, id and type
    const record = new TrackedObject(Object.assign({}, cache.peek(identifier)));
    record.type = identifier.type;
    record.id = identifier.id;

    const token = notifications.subscribe(identifier, (_, change) => {
      if (change === 'attributes') {
        Object.assign(record, cache.peek(identifier));
      }
    });

    record.destroy = () => notifications.unsubscribe(token);
    return record;
  }

  teardownRecord(record) {
    record.destroy();
  }
}
```

Because the Store treats the record as opaque, an implementation can be anything from a
simple object to a proxy that links associated records through relationships; the
[instantiateRecord hook](../../@warp-drive/core/classes/Store.md#instantiaterecord) documentation says
what else that boundary makes possible.

Typically you will choose an existing record implementation such as `@ember-data/model`
for your application.

:::tip Note
The `ember-data` package automatically includes the `@ember-data/model`
package and configures it for you.
:::
